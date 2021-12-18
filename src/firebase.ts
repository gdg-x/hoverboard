import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  getFirestore,
} from 'firebase/firestore';
import { initializePerformance } from 'firebase/performance';
import { isLocalhost } from './utils/environment';

const response = await fetch('/__/firebase/init.json');
const options: FirebaseOptions = await response.json();

const firebaseApp: FirebaseApp = initializeApp(options);
const db = getFirestore(firebaseApp);

if (isLocalhost()) {
  console.log('Connecting to Firestore Emulator');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

initializePerformance(firebaseApp);
enableMultiTabIndexedDbPersistence(db);

export { db, firebaseApp };
