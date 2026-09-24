// https://github.com/import-js/eslint-plugin-import/issues/1810

import { DocumentData, DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  createTimeWindow,
  filterUpcomingTimeslots,
  getTodayDateString,
  parseTimeAndGetFromNow,
} from '../time.js';
import { isInvalidTokenError } from '../utils/messaging.js';

const removeUserTokens = (tokensToUsers: Record<string, string>) => {
  const userTokens = Object.keys(tokensToUsers).reduce((acc: Record<string, string[]>, token) => {
    const userId = tokensToUsers[token];
    if (!userId) return acc;
    const existingTokens = acc[userId] || [];

    return { ...acc, [userId]: [...existingTokens, token] };
  }, {});

  const promises = Object.keys(userTokens).map((userId) => {
    const ref = getFirestore().collection('notificationsUsers').doc(userId);

    return getFirestore().runTransaction((transaction) =>
      transaction.get(ref).then((doc) => {
        if (!doc.exists) {
          return;
        }

        const val = doc.data() || {};
        const newVal = Object.keys(val).reduce((acc: Record<string, boolean>, token) => {
          if (tokensToUsers[token]) return acc;

          return { ...acc, [token]: true };
        }, {});

        transaction.set(ref, newVal);
      }),
    );
  });

  return Promise.all(promises);
};

const sendPushNotificationToUsers = async (userIds: string[], data: MulticastMessage['data']) => {
  logger.log('sendPushNotificationToUsers user ids', userIds, 'with notification', data);

  const tokensPromise = userIds.map((id) => {
    return getFirestore().collection('notificationsUsers').doc(id).get();
  });

  const usersTokens: DocumentSnapshot<DocumentData>[] = await Promise.all(tokensPromise);
  const tokensToUsers = usersTokens.reduce<Record<string, any>>((aggregator, userTokens) => {
    if (!userTokens.exists) return aggregator;
    const { tokens } = userTokens.data() || {};
    return { ...aggregator, tokens };
  }, {});
  const tokens = Object.keys(tokensToUsers);

  const tokensToRemove: Record<string, string> = {};
  const messagingResponse = await getMessaging().sendEachForMulticast({ tokens, data });
  messagingResponse.responses.forEach((result, index) => {
    const error = result.error;
    if (error) {
      logger.error('Failure sending notification to', tokens[index], error);
      if (isInvalidTokenError(error.code)) {
        const token = tokens[index]!;
        tokensToRemove[token] = tokensToUsers[token];
      }
    }
  });

  return removeUserTokens(tokensToRemove);
};

export const scheduleNotifications = onSchedule('every 5 minutes', async () => {
  const notificationsConfigPromise = getFirestore().collection('config').doc('notifications').get();
  const schedulePromise = getFirestore().collection('schedule').get();

  const [notificationsConfigSnapshot, scheduleSnapshot] = await Promise.all([
    notificationsConfigPromise,
    schedulePromise,
  ]);
  const notificationsConfig = notificationsConfigSnapshot.exists
    ? (notificationsConfigSnapshot.data() as { timezone?: string; icon?: string })
    : {};

  const schedule = scheduleSnapshot.docs.reduce(
    (acc: Record<string, any>, doc) => ({ ...acc, [doc.id]: doc.data() }),
    {},
  );
  const todayDay = getTodayDateString(notificationsConfig.timezone);

  if (schedule[todayDay]) {
    const timeWindow = createTimeWindow(3, 3);
    const timezone = notificationsConfig.timezone || '';

    const upcomingTimeslots = filterUpcomingTimeslots(
      schedule[todayDay].timeslots || [],
      timeWindow,
      10, // notification offset in minutes
      timezone,
    );

    const upcomingSessions: string[] = upcomingTimeslots.reduce(
      (result: string[], timeslot: { sessions?: { items?: string[] }[] }) =>
        (timeslot.sessions || []).reduce(
          (aggregatedSessions: string[], current: { items?: string[] }) => [
            ...aggregatedSessions,
            ...(current.items || []),
          ],
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
      if (!sessionInfoSnapshot.exists) return;

      const usersIds = usersIdsSnapshot.docs.reduce(
        (acc: Record<string, Record<string, unknown>>, doc) => ({ ...acc, [doc.id]: doc.data() }),
        {},
      );

      const userIdsFeaturedSession = Object.keys(usersIds).filter(
        (userId) =>
          !!Object.keys(usersIds[userId] || {}).filter(
            (sessionId) => sessionId.toString() === upcomingSession.toString(),
          ).length,
      );

      const session = sessionInfoSnapshot.data();
      const firstTimeslot = upcomingTimeslots[0];
      const fromNow = firstTimeslot
        ? parseTimeAndGetFromNow(firstTimeslot.startTime, timezone)
        : '';

      if (userIdsFeaturedSession.length) {
        const data: MulticastMessage['data'] = {
          title: session?.title || '',
          body: `Starts ${fromNow}`,
          icon: notificationsConfig.icon || '',
          path: `/sessions/${upcomingSessions[sessionIndex]}`,
        };
        await sendPushNotificationToUsers(userIdsFeaturedSession, data);
      }

      if (upcomingSessions.length) {
        logger.log('Upcoming sessions', upcomingSessions);
      } else {
        logger.log('There is no sessions right now');
      }
    });
  } else {
    logger.log(todayDay, 'was not found in the schedule');
  }
});
