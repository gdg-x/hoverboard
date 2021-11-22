import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { initializePerformance } from 'firebase/performance';

const response = await fetch('/__/firebase/init.json');
export const firebaseApp = initializeApp(await response.json());
export const db = getFirestore(firebaseApp);

initializePerformance(firebaseApp);
enableMultiTabIndexedDbPersistence(db);
