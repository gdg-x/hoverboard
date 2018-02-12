import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';

const FORMAT = 'HH:mm';

const removeUserTokens = tokensToUsers => {
  const promises = [];
  Object.keys(tokensToUsers).forEach(token => {
    promises.push(admin.database().ref(`/notifications/users/${tokensToUsers[token]}/${token}`).remove());
  });
  return Promise.all(promises);
};

const sendPushNotificationToUsers = async (userIds, payload) => {
  console.log('sendPushNotificationToUsers user ids', userIds, 'with notification', payload);
  const tokensPromise = userIds.map(id => admin.database().ref(`/notifications/users/${id}`).once('value'));
  const usersTokens = await Promise.all(tokensPromise);
  const tokensToUsers = usersTokens.reduce((aggregator, userTokens) => {
    if (!userTokens.val()) return aggregator;
    return Object.assign(aggregator, userTokens.val());
  }, {});
  const tokens = Object.keys(tokensToUsers);

  const tokensToRemove = {};
  const messagingResponse = await admin.messaging().sendToDevice(tokens, payload);
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

export const scheduleNotifications = functions.pubsub.topic('schedule-tick').onPublish(async () => {
    const notificationsConfigPromise = admin.database().ref(`/notifications/config`).once('value');
    const schedulePromise = admin.database().ref(`/schedule`).once('value');

    const [notificationsConfigSnapshot, scheduleSnapshot] = await Promise.all([notificationsConfigPromise, schedulePromise]);
    const notificationsConfig = notificationsConfigSnapshot.val();
    const schedule = scheduleSnapshot.val();
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
      const usersIdsSnapshot = await admin.database().ref(`/featuredSessions`).once('value');

      upcomingSessions.forEach(async (upcomingSession, sessionIndex) => {
        const sessionInfoSnapshot = await admin.database().ref(`/sessions/${upcomingSession}`).once('value');
        const usersIds = usersIdsSnapshot.val();
        const userIdsFeaturedSession = Object.keys(usersIds)
          .filter(userId => !!Object.keys(usersIds[userId])
            .filter(sessionId => (sessionId.toString() === upcomingSession.toString())).length);

        const session = sessionInfoSnapshot.val();
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
