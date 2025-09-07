// https://github.com/import-js/eslint-plugin-import/issues/1810

import { DocumentData, DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getMessaging, MessagingPayload } from 'firebase-admin/messaging';
import * as functions from 'firebase-functions';
import {
  createTimeWindow,
  filterUpcomingTimeslots,
  getTodayDateString,
  parseTimeAndGetFromNow,
} from './time';

const removeUserTokens = (tokensToUsers) => {
  const userTokens = Object.keys(tokensToUsers).reduce((acc, token) => {
    const userId = tokensToUsers[token];
    const userTokens = acc[userId] || [];

    return { ...acc, [userId]: [...userTokens, token] };
  }, {});

  const promises = Object.keys(userTokens).map((userId) => {
    const ref = getFirestore().collection('notificationsUsers').doc(userId);

    return getFirestore().runTransaction((transaction) =>
      transaction.get(ref).then((doc) => {
        if (!doc.exists) {
          return;
        }

        const val = doc.data();
        const newVal = Object.keys(val).reduce((acc, token) => {
          if (tokensToUsers[token]) return acc;

          return { ...acc, [token]: true };
        }, {});

        transaction.set(ref, newVal);
      }),
    );
  });

  return Promise.all(promises);
};

const sendPushNotificationToUsers = async (userIds: string[], payload: MessagingPayload) => {
  functions.logger.log(
    'sendPushNotificationToUsers user ids',
    userIds,
    'with notification',
    payload,
  );

  const tokensPromise = userIds.map((id) => {
    return getFirestore().collection('notificationsUsers').doc(id).get();
  });

  const usersTokens: DocumentSnapshot<DocumentData>[] = await Promise.all(tokensPromise);
  const tokensToUsers = usersTokens.reduce((aggregator, userTokens) => {
    if (!userTokens.exists) return aggregator;
    const { tokens } = userTokens.data();
    return { ...aggregator, tokens };
  }, {});
  const tokens = Object.keys(tokensToUsers);

  const tokensToRemove = {};
  const messagingResponse = await getMessaging().sendToDevice(tokens, payload);
  messagingResponse.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      functions.logger.error('Failure sending notification to', tokens[index], error);
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        const token = tokens[index];
        tokensToRemove[token] = tokensToUsers[token];
      }
    }
  });

  return removeUserTokens(tokensToRemove);
};

export const scheduleNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const notificationsConfigPromise = getFirestore()
      .collection('config')
      .doc('notifications')
      .get();
    const schedulePromise = getFirestore().collection('schedule').get();

    const [notificationsConfigSnapshot, scheduleSnapshot] = await Promise.all([
      notificationsConfigPromise,
      schedulePromise,
    ]);
    const notificationsConfig = notificationsConfigSnapshot.exists
      ? notificationsConfigSnapshot.data()
      : {};

    const schedule = scheduleSnapshot.docs.reduce(
      (acc, doc) => ({ ...acc, [doc.id]: doc.data() }),
      {},
    );
    const todayDay = getTodayDateString(notificationsConfig.timezone);

    if (schedule[todayDay]) {
      const timeWindow = createTimeWindow(3, 3);

      const upcomingTimeslot = filterUpcomingTimeslots(
        schedule[todayDay].timeslots,
        timeWindow,
        10, // notification offset in minutes
        notificationsConfig.timezone,
      );

      const upcomingSessions = upcomingTimeslot.reduce(
        (result, timeslot) =>
          timeslot.sessions.reduce(
            (aggregatedSessions, current) => [...aggregatedSessions, ...current.items],
            result,
          ),
        [],
      );
      const usersIdsSnapshot = await getFirestore().collection('featuredSessions').get();

      upcomingSessions.forEach(async (upcomingSession, sessionIndex) => {
        const sessionInfoSnapshot = await getFirestore()
          .collection('sessions')
          .doc(upcomingSession)
          .get();
        if (!sessionInfoSnapshot.exists) return undefined;

        const usersIds = usersIdsSnapshot.docs.reduce(
          (acc, doc) => ({ ...acc, [doc.id]: doc.data() }),
          {},
        );

        const userIdsFeaturedSession = Object.keys(usersIds).filter(
          (userId) =>
            !!Object.keys(usersIds[userId]).filter(
              (sessionId) => sessionId.toString() === upcomingSession.toString(),
            ).length,
        );

        const session = sessionInfoSnapshot.data();
        const fromNow = parseTimeAndGetFromNow(
          upcomingTimeslot[0].startTime,
          notificationsConfig.timezone,
        );

        if (userIdsFeaturedSession.length) {
          const payload: MessagingPayload = {
            data: {
              title: session.title,
              body: `Starts ${fromNow}`,
              icon: notificationsConfig.icon,
              path: `/sessions/${upcomingSessions[sessionIndex]}`,
            },
          };

          return sendPushNotificationToUsers(userIdsFeaturedSession, payload);
        }

        if (upcomingSessions.length) {
          functions.logger.log('Upcoming sessions', upcomingSessions);
        } else {
          functions.logger.log('There is no sessions right now');
        }

        return undefined;
      });
    } else {
      functions.logger.log(todayDay, 'was not found in the schedule');
    }
  });
