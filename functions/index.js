'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment');
const format = 'HH:mm';
const timezone = '+03:00';
admin.initializeApp(functions.config().firebase);

exports.sendGeneralNotification = functions.database.ref('/notifications/messages/{timestamp}').onWrite(event => {
  const timestamp = event.params.timestamp;
  const message = event.data.val();
  console.log('New message added at ', timestamp, ' with message ', message);
  const getDeviceTokensPromise = admin.database().ref(`/notifications/subscribers`).once('value');
  return getDeviceTokensPromise.then(tokensSnapshot => {
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
    const payload = {
      notification: {
        title: message.title,
        body: message.body,
        icon: message.icon || 'images/icon.svg'
      }
    };

    const tokens = Object.keys(tokensSnapshot.val());
    return admin.messaging().sendToDevice(tokens, payload)
      .then(response => {
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
            }
          }
        });
        return Promise.all(tokensToRemove);
      });
  });
});

const removeUserTokens = tokensToUsers => {
  Object.keys(tokensToUsers).forEach(token => {
    admin.database().ref(`/notifications/users/${tokensToUsers[token]}/${token}`).remove();
  });
};

const sendPushNotificationToUsers = (userIds, payload) => {
  console.log('sendPushNotificationToUsers user ids', userIds, payload);
  const tokensPromise = userIds.map(id => admin.database().ref(`/notifications/users/${id}`).once('value'));
  Promise.all(tokensPromise)
    .then(results => {
      const tokensInUser = results.reduce((result, tokens, index) => Object.assign(result, tokens.val().reduce((res, token) => (res[userIds[index]] = token), {})), {});
      const tokens = Object.keys(tokensInUser);
      console.log('tokens', tokens);

      admin.messaging().sendToDevice(tokens, payload).then(response => {
        const tokensToRemove = {};

        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
              // tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
              const token = tokens[index];
              tokensToRemove[token] = tokensInUser[token];
            }
          }
        });

        removeUserTokens(tokensToRemove);
      });
    });
};

exports.sessionsNotifications = functions.pubsub.topic('session-tick').onPublish(() => {
  console.log("This job is ran every 5 minutes from 09:00 to 18:00!");
  const todayDay = moment().utcOffset(timezone).format('YYYY-MM-DD');
  const schedulePromise = admin.database().ref(`/schedule`).once('value');

  schedulePromise
    .then(scheduleSnapshot => {
      const schedule = scheduleSnapshot.val();
      if (schedule[todayDay]) {
        const beforeTime = moment().subtract(3, 'minutes');
        const afterTime = moment().add(3, 'minutes');
        console.log('Looking for sessions between', beforeTime.format(), afterTime.format()); // TODO: Fix time

        const upcomingTimeslot = schedule[todayDay].timeslots
          .filter(timeslot => {
            const timeslotTime = moment(`${timeslot.startTime}${timezone}`, `${format}Z`).subtract(10, 'minutes');
            console.log(timeslot.startTime, timeslotTime, timeslotTime.isBetween(beforeTime, afterTime));
            return timeslotTime.isBetween(beforeTime, afterTime);
          });

        const upcomingSessions = upcomingTimeslot.reduce((result, timeslot) => timeslot.sessions.reduce((result, current) => result.concat(current.items), []), []);

        for (let i = 0; i < upcomingSessions.length; i++) {
          const userFeaturedSessionsPromise = admin.database().ref(`/featuredSessions`).once('value'); //TODO: move up
          const sessionInfoPromise = admin.database().ref(`/sessions/${upcomingSessions[i]}`).once('value');

          Promise.all([userFeaturedSessionsPromise, sessionInfoPromise])
            .then(results => {
              const usersIds = results[0].val();
              const userIdsFeaturedSession = Object.keys(usersIds)
                .filter(userId => !!Object.keys(usersIds[userId]).filter(sessionId => sessionId.toString() === upcomingSessions[i].toString()).length);
              const session = results[1].val();
              // console.log('Users', userIdsFeaturedSession, 'featured', session);
              const end = moment(`${upcomingTimeslot[0].startTime}${timezone}`, `${format}Z`);
              const fromNow = end.fromNow();
              if (userIdsFeaturedSession.length) {
                sendPushNotificationToUsers(userIdsFeaturedSession, {
                  notification: {
                    title: session.title,
                    body: `Starts ${fromNow}`,
                    icon: 'images/icon.svg'
                  }
                });
              }
            })
            .catch(e => console.log('Error at featured session fetch', e));
        }

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
