import admin from 'firebase-admin';

let firestore = null;
export function initializeFirebase() {
  return new Promise((resolve) => {
    // TODO: Don't hardcode this
    const firebaseApp = admin.initializeApp({
      projectId: 'hoverboard-dev',
    });
    firestore = admin.firestore();
    firestore.settings({
      host: 'localhost:8080',
      ssl: false,
    });
    resolve(firebaseApp);
  });
}

export { firestore };
