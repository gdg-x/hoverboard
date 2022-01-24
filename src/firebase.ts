import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { getPerformance, initializePerformance } from 'firebase/performance';

const response = await fetch('/__/firebase/init.json');
export const firebaseApp = initializeApp(await response.json());
export const db = getFirestore(firebaseApp);
export const performance = getPerformance(firebaseApp);
export const analytics = getAnalytics(firebaseApp);

initializePerformance(firebaseApp);
enableMultiTabIndexedDbPersistence(db);
