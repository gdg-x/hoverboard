// https://github.com/import-js/eslint-plugin-import/issues/1810

import { initializeApp } from 'firebase-admin/app';
import { sendGeneralNotification } from './triggers/notifications.js';
import { scheduleNotifications } from './triggers/schedule-notifications.js';

initializeApp();

export { sendGeneralNotification, scheduleNotifications };
