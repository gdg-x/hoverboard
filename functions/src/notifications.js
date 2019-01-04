import * as functions from 'firebase-functions';
import { firestore, messaging } from 'firebase-admin';

const sendGeneralNotification = functions.firestore.document('/notifications/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const timestamp = context.params.timestamp;
    const message = snapshot.data();
    console.log(timestamp, message);

    if (!message) return null;
    console.log('New message added at ', timestamp, ' with payload ', message);
    const deviceTokensPromise = firestore().collection('notificationsSubscribers').get();
    const notificationsConfigPromise = firestore().collection('config').doc('notifications').get();

    const [tokensSnapshot, notificationsConfigSnapshot] = await Promise.all([deviceTokensPromise, notificationsConfigPromise]);
    const notificationsConfig = notificationsConfigSnapshot.exists ? notificationsConfigSnapshot.data() : {};

    const tokens = tokensSnapshot.docs.map(doc => doc.id);

    if (!tokens.length) {
      console.log('There are no notification tokens to send to.');
      return null;
    }
    console.log('There are', tokens.length, 'tokens to send notifications to.');

    const payload = {
      data: Object.assign({}, message, {
        icon: message.icon || notificationsConfig.icon
      })
    };

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
