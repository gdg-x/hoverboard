import admin from 'firebase-admin';
import serviceAccount from '../serviceAccount.json';

const credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
admin.initializeApp({ credential });
const firestore = admin.firestore();

export { firestore };
