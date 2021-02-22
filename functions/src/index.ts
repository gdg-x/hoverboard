import * as admin from 'firebase-admin';
import { scheduleWrite, sessionsWrite, speakersWrite } from './generate-sessions-speakers-schedule';
import { optimizeImages } from './optimize-images';
import { prerender } from './prerender';

// TODO: Enable in case we use subscription
// import { mailchimpSubscribe } from './mailchimp-subscribe';

// TODO: Enable in case we use notifications
// import { sendGeneralNotification } from './notifications';
// import { scheduleNotifications } from './schedule-notifications';

// TODO: Enable in case we use login
// import { saveUserData } from './save-user-data';

// TODO: Update `tsconfig.json`
// - "noImplicitReturns": true,
// - "strict": true,

admin.initializeApp();

export {
  optimizeImages,
  prerender,
  scheduleWrite,
  sessionsWrite,
  speakersWrite,
  // mailchimpSubscribe,
  // sendGeneralNotification,
  // scheduleNotifications,
  // saveUserData,
};
