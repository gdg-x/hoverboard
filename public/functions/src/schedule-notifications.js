import * as functions from 'firebase-functions';
import { firestore, messaging } from 'firebase-admin';
import moment from 'moment';

const FORMAT = 'HH:mm';

const removeUserTokens = tokensToUsers => {
  const userTokens = Object.keys(tokensToUsers).reduce((acc, token) => {
    const userId = tokensToUsers[token];
    const userTokens = acc[userId] || [];

    return { ...acc, [userId]: [ ...userTokens, token ]};
  }, {});

  const promises = Object.keys(userTokens).map(userId => {
    const ref = firestore().collection('notificationsUsers').doc(userId);

    return firestore.runTransaction(transaction => transaction
      .get(ref)
      .then(doc => {
        if (!doc.exists) {
          return;
        }

        const val = doc.data();
        const newVal = Object.keys(val).reduce((acc, token) => {
          if (tokensToUsers[token]) return acc;

          return { ...acc, [token]: true };
        }, {});

        transaction.set(newVal);
      })
    );
  });

  return Promise.all(promises);
};

const sendPushNotificationToUsers = async (userIds, payload) => {
  console.log('sendPushNotificationToUsers user ids', userIds, 'with notification', payload);

  const tokensPromise = userIds.map(id => firestore().collection('notificationsUsers').doc(id).get());

  const usersTokens = await Promise.all(tokensPromise);
  const tokensToUsers = usersTokens.reduce((aggregator, userTokens) => {
    if (!userTokens.exists) return aggregator;
    const { tokens } = userTokens.data();
    return { ...aggregator, tokens };
  }, {});
  const tokens = Object.keys(tokensToUsers);

  const tokensToRemove = {};
  const messagingResponse = await messaging().sendToDevice(tokens, payload);
  messagingResponse.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error('Failure sending notification to', tokens[index], error);
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        const token = tokens[index];
        tokensToRemove[token] = tokensToUsers[token];
      }
    }
  });

  return removeUserTokens(tokensToRemove);
};

const scheduleNotifications = functions.pubsub.topic('schedule-tick').onPublish(async () => {
    const notificationsConfigPromise = firestore().collection('config').doc('notifications').get();
    const schedulePromise = firestore().collection('schedule').get();

    const [notificationsConfigSnapshot, scheduleSnapshot] = await Promise.all([notificationsConfigPromise, schedulePromise]);
    const notificationsConfig = notificationsConfigSnapshot.exists ? notificationsConfigSnapshot.data() : {};

    const schedule = scheduleSnapshot.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data() }), {});
    const todayDay = moment().utcOffset(notificationsConfig.timezone).format('YYYY-MM-DD');

    if (schedule[todayDay]) {
      const beforeTime = moment().subtract(3, 'minutes');
      const afterTime = moment().add(3, 'minutes');

      const upcomingTimeslot = schedule[todayDay].timeslots
        .filter(timeslot => {
          const timeslotTime = moment(`${timeslot.startTime}${notificationsConfig.timezone}`, `${FORMAT}Z`).subtract(10, 'minutes');
          return timeslotTime.isBetween(beforeTime, afterTime);
        });

      const upcomingSessions = upcomingTimeslot.reduce((result, timeslot) =>
        timeslot.sessions.reduce((aggregatedSessions, current) => [...aggregatedSessions, ...current.items], []));
      const usersIdsSnapshot = await firestore().collection('featuredSessions').get();

      upcomingSessions.forEach(async (upcomingSession, sessionIndex) => {
        const sessionInfoSnapshot = await firestore().collection('sessions').doc(upcomingSession).get();
        if (!sessionInfoSnapshot.exists) return;

        const usersIds = usersIdsSnapshot.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data() }), {});

        const userIdsFeaturedSession = Object.keys(usersIds)
          .filter(userId => !!Object.keys(usersIds[userId])
            .filter(sessionId => (sessionId.toString() === upcomingSession.toString()))
            .length
          );

        const session = sessionInfoSnapshot.data();
        const end = moment(`${upcomingTimeslot[0].startTime}${notificationsConfig.timezone}`, `${FORMAT}Z`);
        const fromNow = end.fromNow();

        if (userIdsFeaturedSession.length) {
          return sendPushNotificationToUsers(userIdsFeaturedSession, {
            data: {
              title: session.title,
              body: `Starts ${fromNow}`,
              click_action: `/schedule/${todayDay}?sessionId=${upcomingSessions[sessionIndex]}`,
              icon: notificationsConfig.icon
            }
          });
        }

        if (upcomingSessions.length) {
          console.log('Upcoming sessions', upcomingSessions);
        } else {
          console.log('There is no sessions right now');
        }
      });
    } else {
      console.log(todayDay, 'was not found in the schedule')
    }
  }
);

export default scheduleNotifications;
