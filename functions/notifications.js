'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sendGeneralNotification = functions.database.ref('/notifications/messages/{timestamp}').onWrite(event => {
  const timestamp = event.params.timestamp;
  const message = event.data.val();

  if (!message) return null;
  console.log('New message added at ', timestamp, ' with payload ', message);
  const deviceTokensPromise = admin.database().ref(`/notifications/subscribers`).once('value');
  const notificationsConfigPromise = admin.database().ref(`/notifications/config`).once('value');

  return Promise.all([deviceTokensPromise, notificationsConfigPromise])
    .then(([tokensSnapshot, notificationsConfigSnapshot]) => {
      const notificationsConfig = notificationsConfigSnapshot.val();

      if (!tokensSnapshot.hasChildren()) {
        return console.log('There are no notification tokens to send to.');
      }
      console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');

      const payload = {
        data: Object.assign({}, message, {
          icon: message.icon || notificationsConfig.icon
        })
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
