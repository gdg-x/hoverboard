import admin from 'firebase-admin';
// eslint-disable-next-line import/no-unresolved
import serviceAccount from '../serviceAccount';

let firestore = null;
export function initializeFirebase() {
  return new Promise((resolve) => {
    const firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firestore = admin.firestore();
    resolve(firebaseApp);
  });
}

export { firestore };
