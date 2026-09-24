// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { fetchConfig } from '../db/config.js';
import {
  deleteNotificationSubscriber,
  fetchNotificationSubscribers,
} from '../db/notifications-subscribers.js';
import { isInvalidTokenError } from '../utils/messaging.js';

export const sendGeneralNotification = onDocumentCreated(
  '/notifications/{timestamp}',
  async (event) => {
    const timestamp = event.params.timestamp;
    const message = event.data?.data();

    if (!message) return undefined;

    logger.log(`New message added at ${timestamp} with payload ${message}`);

    const deviceTokensPromise = fetchNotificationSubscribers();
    const notificationsConfigPromise = fetchConfig<{ icon?: string }>('notifications');

    const [tokensSnapshot, notificationsConfigSnapshot] = await Promise.all([
      deviceTokensPromise,
      notificationsConfigPromise,
    ]);
    const notificationsConfig = notificationsConfigSnapshot.exists
      ? (notificationsConfigSnapshot.data() as { icon?: string })
      : {};

    const tokens = tokensSnapshot.docs.map((doc) => doc.id);

    if (!tokens.length) {
      logger.log('There are no notification tokens to send to.');
      return undefined;
    }
    logger.log(`There are ${tokens.length} tokens to send notifications to.`);

    const multicastMessage: MulticastMessage = {
      tokens,
      data: {
        title: message.title,
        body: message.body,
        icon: message.icon || notificationsConfig.icon || '',
      },
    };

    if (message.path && multicastMessage.data) {
      multicastMessage.data.path = message.path;
    }

    const tokensToRemove: Promise<unknown>[] = [];
    const messagingResponse = await getMessaging().sendEachForMulticast(multicastMessage);
    messagingResponse.responses.forEach((result, index) => {
      const error = result.error;
      if (error) {
        logger.error(`Failure sending notification to ${tokens[index]}`, error);
        if (isInvalidTokenError(error.code)) {
          tokensToRemove.push(deleteNotificationSubscriber(tokens[index]!));
        }
      }
    });

    return Promise.all(tokensToRemove);
  },
);
