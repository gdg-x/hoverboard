// https://github.com/import-js/eslint-plugin-import/issues/1810

import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { fetchConfig } from '../db/config.js';
import {
  deleteNotificationSubscriber,
  fetchNotificationSubscribers,
} from '../db/notifications-subscribers.js';
import { isInvalidTokenError, sendToTokens } from '../utils/messaging.js';

export const sendGeneralNotification = onDocumentCreated(
  '/notifications/{timestamp}',
  async (event) => {
    const timestamp = event.params.timestamp;
    const message = event.data?.data();

    if (!message) return undefined;

    // FCM rejects data payloads with missing values.
    if (typeof message.title !== 'string' || typeof message.body !== 'string') {
      logger.error(`Notification ${timestamp} needs a \`title\` and a \`body\` string.`);
      return undefined;
    }

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

    const data: Record<string, string> = {
      title: message.title,
      body: message.body,
      icon: message.icon || notificationsConfig.icon || '',
    };

    if (message.path) {
      data.path = message.path;
    }

    const failures = await sendToTokens(tokens, data);
    const tokensToRemove = failures.flatMap(({ token, error }) => {
      logger.error(`Failure sending notification to ${token}`, error);
      return isInvalidTokenError(error.code) ? [deleteNotificationSubscriber(token)] : [];
    });

    return Promise.all(tokensToRemove);
  },
);
