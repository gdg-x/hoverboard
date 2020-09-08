import * as admin from 'firebase-admin';
import { scheduleWrite, sessionsWrite, speakersWrite } from './generate-sessions-speakers-schedule';
import { mailchimpSubscribe } from './mailchimp-subscribe';
import { sendGeneralNotification } from './notifications';
import { optimizeImages } from './optimize-images';
import { prerender } from './prerender';
import { saveUserData } from './save-user-data';
import { scheduleNotifications } from './schedule-notifications';

// TODO: Update `tsconfig.json`
// - "noImplicitReturns": true,
// - "strict": true,

admin.initializeApp();

export {
  saveUserData,
  sendGeneralNotification,
  scheduleNotifications,
  optimizeImages,
  mailchimpSubscribe,
  prerender,
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
};
