// https://github.com/import-js/eslint-plugin-import/issues/1810

import { initializeApp } from 'firebase-admin/app';
import {
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
} from './triggers/generate-sessions-speakers-schedule.js';
import { mailchimpSubscribe } from './triggers/mailchimp-subscribe.js';
import { sendGeneralNotification } from './triggers/notifications.js';
import { optimizeImages } from './triggers/optimize-images.js';
import { prerender } from './triggers/prerender.js';
import { scheduleNotifications } from './triggers/schedule-notifications.js';

// TODO: Update `tsconfig.json`
// - "noImplicitReturns": true,
// - "strict": true,

initializeApp();

export {
  sendGeneralNotification,
  scheduleNotifications,
  optimizeImages,
  mailchimpSubscribe,
  prerender,
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
};
