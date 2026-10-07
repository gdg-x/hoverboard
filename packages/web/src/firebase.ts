import { getAnalytics } from 'firebase/analytics';
import { type FirebaseOptions, initializeApp } from 'firebase/app';
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
 * Local development always runs on the emulators with a `demo-` project (see `npm start`), which
 * cannot reach real Firebase services. Connect must happen before any other Firestore calls.
 */
export const isDemoProject = firebaseConfig.projectId?.startsWith('demo-') ?? false;

if (isDemoProject) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Demo projects have no app ID, which Analytics and Performance Monitoring need.
export const analytics = isDemoProject ? undefined : getAnalytics(firebaseApp);

if (!isDemoProject) {
  getPerformance(firebaseApp);
  initializePerformance(firebaseApp);
}
