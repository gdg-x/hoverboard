import admin from 'firebase-admin';

import saveUserData from './save-user-data';
import sendGeneralNotification from './notifications';
import scheduleNotifications from './schedule-notifications';
import optimizeImages from './optimize-images';
import mailchimpSubscribe from './mailchimp-subscribe';
import prerender from './prerender';
import { scheduleWrite, sessionsWrite, speakersWrite } from './schedule-generator';

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
}
