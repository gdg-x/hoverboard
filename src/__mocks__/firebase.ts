import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

console.log('mocks.initializeApp.1');
export const firebaseApp = initializeApp({
  apiKey: 'API_KEY',
  authDomain: 'PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://PROJECT_ID.firebaseio.com',
  projectId: 'PROJECT_ID',
  storageBucket: 'PROJECT_ID.appspot.com',
  messagingSenderId: 'SENDER_ID',
  appId: 'APP_ID',
  measurementId: 'G-MEASUREMENT_ID',
});
console.log('mocks.initializeApp.2');
export const db = getFirestore(firebaseApp);
