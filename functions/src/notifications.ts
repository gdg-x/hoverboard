// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getMessaging, MessagingPayload } from 'firebase-admin/messaging';
import * as functions from 'firebase-functions';

const REMOVE_TOKEN_ERROR = [
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
];

export const sendGeneralNotification = functions.firestore
  .document('/notifications/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const timestamp = context.params.timestamp;
    const message = snapshot.data();

    if (!message) return undefined;

    functions.logger.log(`New message added at ${timestamp} with payload ${message}`);

    const deviceTokensPromise = getFirestore().collection('notificationsSubscribers').get();
    const notificationsConfigPromise = getFirestore()
      .collection('config')
      .doc('notifications')
      .get();

    const [tokensSnapshot, notificationsConfigSnapshot] = await Promise.all([
      deviceTokensPromise,
      notificationsConfigPromise,
    ]);
    const notificationsConfig = notificationsConfigSnapshot.exists
      ? notificationsConfigSnapshot.data()
      : {};

    const tokens = tokensSnapshot.docs.map((doc) => doc.id);

    if (!tokens.length) {
      functions.logger.log('There are no notification tokens to send to.');
      return undefined;
    }
    functions.logger.log(`There are ${tokens.length} tokens to send notifications to.`);

    const payload: MessagingPayload = {
      data: {
        title: message.title,
        body: message.body,
        icon: message.icon || notificationsConfig.icon,
      },
    };

    if (message.path) {
      payload.data.path = message.path;
    }

    const tokensToRemove = [];
    const messagingResponse = await getMessaging().sendToDevice(tokens, payload);
    messagingResponse.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        functions.logger.error(`Failure sending notification to ${tokens[index]}`, error);
        if (REMOVE_TOKEN_ERROR.includes(error.code)) {
          const tokenRef = getFirestore().collection('notificationsSubscribers').doc(tokens[index]);
          tokensToRemove.push(tokenRef.delete());
        }
      }
    });

    return Promise.all(tokensToRemove);
  });
