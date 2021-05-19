import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { initializePerformance } from 'firebase/performance';

export const firebaseApp = initializeApp({
  apiKey: '{$ firebase.apiKey $}',
  appId: '{$ firebase.appId $}',
  authDomain: '{$ firebase.authDomain $}',
  databaseURL: '{$ firebase.databaseURL $}',
  messagingSenderId: '{$ firebase.messagingSenderId $}',
  projectId: '{$ firebase.projectId $}',
  storageBucket: '{$ firebase.storageBucket $}',
});

export const db = getFirestore(firebaseApp);

initializePerformance(firebaseApp);
enableMultiTabIndexedDbPersistence(db);
