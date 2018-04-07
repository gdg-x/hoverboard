import * as functions from 'firebase-functions';
import { database, messaging } from 'firebase-admin';

const sendGeneralNotification = functions.database.ref('/notifications/messages/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const timestamp = context.params.timestamp;
    const message = snapshot.val();
    console.log(timestamp, message);

    if (!message) return null;
    console.log('New message added at ', timestamp, ' with payload ', message);
    const deviceTokensPromise = database().ref(`/notifications/subscribers`).once('value');
    const notificationsConfigPromise = database().ref(`/notifications/config`).once('value');

    const [tokensSnapshot, notificationsConfigSnapshot] = await Promise.all([deviceTokensPromise, notificationsConfigPromise]);
    const notificationsConfig = notificationsConfigSnapshot.val();

    if (!tokensSnapshot.hasChildren()) {
      console.log('There are no notification tokens to send to.');
      return null;
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');

    const payload = {
      data: Object.assign({}, message, {
        icon: message.icon || notificationsConfig.icon
      })
    };

    const tokens = Object.keys(tokensSnapshot.val());

    const tokensToRemove = [];
    const messagingResponse = await messaging().sendToDevice(tokens, payload);
    messagingResponse.results.forEach((result, index) => {
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

export default sendGeneralNotification;
