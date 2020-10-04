import admin, { ServiceAccount } from 'firebase-admin';
import firestoreService from 'firestore-export-import';
import serviceAccountJson from '../serviceAccount.json';

// TODO: replace
const databaseURL = 'https://hoverboard-dev.firebaseio.com';
const serviceAccount = serviceAccountJson as ServiceAccount;
const credential = admin.credential.cert(serviceAccount);
admin.initializeApp({ credential });
const firestore = admin.firestore();
firestoreService.initializeApp(serviceAccount as string, databaseURL);

console.log(databaseURL);

export { firestore, firestoreService };
