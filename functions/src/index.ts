// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { initializeApp } from 'firebase-admin/app';
import {
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
} from './generate-sessions-speakers-schedule.js';
import { mailchimpSubscribe } from './mailchimp-subscribe.js';
import { sendGeneralNotification } from './notifications.js';
import { optimizeImages } from './optimize-images.js';
import { prerender } from './prerender.js';
import { scheduleNotifications } from './schedule-notifications.js';

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
