import { getAnalytics } from 'firebase/analytics';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';
import { getPerformance, initializePerformance } from 'firebase/performance';

/**
 * Load Firebase config in index.html with /__/firebase/init.js. It stubs out
 * window.firebase.initializeApp to grab the config and saves it on the window
 * for use here. This is a workaround for the fact that the Firebase SDK v9 is
 * modular and doesn't support init.js and top-level await is not well supported
 * so loading from init.json caused issues with Safari, Jest, Vite, etc.
 *
 * https://github.com/gdg-x/hoverboard/pull/2368
 */

declare global {
  interface Window {
    firebaseConfig?: FirebaseOptions;
    process?: { env: { NODE_ENV?: string } };
  }
}

const firebaseConfig = window.firebaseConfig;

if (!firebaseConfig) {
  throw new Error('window.firebaseConfig is not defined');
}

export const firebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
});

/**
 * `npm start` runs the app through the Firebase Hosting emulator alongside
 * the Firestore emulator (see `firebase.json`), so local development never
 * touches production data. Connect must happen before any other Firestore
 * calls are made.
 */
if (window.process?.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export const performance = getPerformance(firebaseApp);
export const analytics = getAnalytics(firebaseApp);

initializePerformance(firebaseApp);
