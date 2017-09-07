'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');

const NOTIFICATION_ICON = 'https://firebasestorage.googleapis.com/v0/b/hoverboard-experimental.appspot.com/o/images%2Fnotification.png?alt=media&token=689dde62-a152-4bb0-8ed8-6aca07eb8064';
const FORMAT = 'HH:mm';
const TIMEZONE = '+03:00';
const BASE_URL = 'https://hoverboard-v2-dev.firebaseapp.com';

const removeUserTokens = tokensToUsers => {
  let promises = [];
  Object.keys(tokensToUsers).forEach(token => {
    promises.push(admin.database().ref(`/notifications/users/${tokensToUsers[token]}/${token}`).remove());
  });
  return Promise.all(promises);
};

const sendPushNotificationToUsers = (userIds, payload) => {
  console.log('sendPushNotificationToUsers user ids', userIds, 'with notification', payload);
  const tokensPromise = userIds.map(id => admin.database().ref(`/notifications/users/${id}`).once('value'));

  return Promise.all(tokensPromise)
    .then(results => {
      const tokensToUsers = results.reduce((result, tokens) => {
        if (!tokens.val()) return result;
        return Object.assign(result, tokens.val());
      }, {});
      const tokens = Object.keys(tokensToUsers);

      return admin.messaging().sendToDevice(tokens, payload)
        .then(response => {
          const tokensToRemove = {};

          response.results.forEach((result, index) => {
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
        });
    });
};

exports.scheduleNotifications = functions.pubsub.topic('schedule-tick').onPublish(() => {
  const todayDay = moment().utcOffset(TIMEZONE).format('YYYY-MM-DD');

  return admin.database().ref(`/schedule`).once('value')
    .then(scheduleSnapshot => {
      const schedule = scheduleSnapshot.val();

      if (schedule[todayDay]) {
        const beforeTime = moment().subtract(3, 'minutes');
        const afterTime = moment().add(3, 'minutes');

        const upcomingTimeslot = schedule[todayDay].timeslots
          .filter(timeslot => {
            const timeslotTime = moment(`${timeslot.startTime}${TIMEZONE}`, `${FORMAT}Z`).subtract(10, 'minutes');
            return timeslotTime.isBetween(beforeTime, afterTime);
          });

        const upcomingSessions = upcomingTimeslot.reduce((result, timeslot) =>
          timeslot.sessions.reduce((result, current) =>
            result.concat(current.items), []), []);
        const userFeaturedSessionsPromise = admin.database().ref(`/featuredSessions`).once('value');

        upcomingSessions.forEach((upcomingSession, sessionIndex) => {
          const sessionInfoPromise = admin.database().ref(`/sessions/${upcomingSession}`).once('value');

          return Promise.all([userFeaturedSessionsPromise, sessionInfoPromise])
            .then(results => {
              const usersIds = results[0].val();
              const userIdsFeaturedSession = Object.keys(usersIds)
                .filter(userId =>
                  !!Object.keys(usersIds[userId]).filter(sessionId =>
                    (sessionId.toString() === upcomingSession.toString()).length));

              const session = results[1].val();
              const end = moment(`${upcomingTimeslot[0].startTime}${TIMEZONE}`, `${FORMAT}Z`);
              const fromNow = end.fromNow();

              if (userIdsFeaturedSession.length) {
                sendPushNotificationToUsers(userIdsFeaturedSession, {
                  notification: {
                    title: session.title,
                    body: `Starts ${fromNow}`,
                    click_action: `${BASE_URL}/schedule/${todayDay}?sessionId=${upcomingSessions[sessionIndex]}`,
                    icon: NOTIFICATION_ICON
                  }
                });
              }
            })
            .catch(e => console.log('Error at featured session fetch', e));
        });

        if (upcomingSessions.length) {
          console.log('Upcoming sessions', upcomingSessions);
        } else {
          console.log('There is no sessions right now');
        }
      } else {
        console.log(todayDay, 'was not found in the schedule')
      }
    })
});
