'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const NOTIFICATION_ICON = 'https://firebasestorage.googleapis.com/v0/b/hoverboard-experimental.appspot.com/o/images%2Fnotification.png?alt=media&token=689dde62-a152-4bb0-8ed8-6aca07eb8064';

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
      notification: Object.assign({}, message, {
        icon: message.icon || NOTIFICATION_ICON
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
