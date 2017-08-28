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
    return admin.messaging().sendToDevice(tokens, payload).then(response => {
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


const sendPushNotificationToUsers = (userIds, payload) => {
  const tokensPromise = userIds.map(id => admin.database().ref(`/notifications/users/${id}`).once('value'));
  Promise.all(tokensPromise)
    .then(results => {
      const tokens = results.map(result => Object.keys(result.val()));

      admin.messaging().sendToDevice(tokens, payload).then(response => {
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
      if (Object.keys(schedule).indexOf(todayDay) > -1) {
        const beforeTime = moment().utcOffset(timezone).subtract(3, 'minutes');
        const afterTime = moment().utcOffset(timezone).add(3, 'minutes');
        console.log('Looking for sessions between', beforeTime, afterTime);

        const upcomingTimeslot = schedule[todayDay].timeslots
          .filter(timeslot => {
            const timeslotTime = moment(`${timeslot.startTime}${timezone}`, `${format}Z`).utcOffset(timezone);
            console.log(timeslot.startTime, timeslotTime, timeslotTime.isBetween(beforeTime, afterTime));
            return timeslotTime.isBetween(beforeTime, afterTime);
          });

        const upcomingSessions = upcomingTimeslot.map(timeslot => timeslot.sessions.map(subSession => subSession.items));

        for (let i = 0; i < upcomingSessions.length; i++) {
          const userFeaturedSessionsPromise = admin.database().ref(`/featuredSessions/${upcomingSessions[i]}`).once('value');
          const sessionInfoPromise = admin.database().ref(`/sessions/${upcomingSessions[i]}`).once('value');

          Promise.all([userFeaturedSessionsPromise, sessionInfoPromise])
            .then(results => {
              const userIdsFeaturedSession = Object.keys(results[0].val());
              const session = results[1].val();
              console.log('Users', userIdsFeaturedSession, 'featured', session);
              const end = moment(upcomingTimeslot[0].startTime, format); // another date
              const duration = moment.duration(moment().diff(end));
              const minutes = duration.asMinutes();
              sendPushNotificationToUsers(userIdsFeaturedSession, {
                notification: {
                  title: session.title,
                  body: `Starts in ${minutes} minutes`,
                  icon: 'images/icon.svg'
                }
              });
            })
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
