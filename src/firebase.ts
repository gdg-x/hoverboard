import { getAnalytics } from 'firebase/analytics';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore';
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
  }
}

const firebaseConfig = window.firebaseConfig;

if (!firebaseConfig) {
  throw new Error('window.firebaseConfig is not defined');
}

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const performance = getPerformance(firebaseApp);
export const analytics = getAnalytics(firebaseApp);

initializePerformance(firebaseApp);
enableMultiTabIndexedDbPersistence(db);
