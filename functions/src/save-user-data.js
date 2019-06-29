import { auth } from 'firebase-functions';
import { firestore } from 'firebase-admin';

const saveUserData = auth.user().onCreate((userRecord) => {
  const uid = userRecord.uid || userRecord.providerData[0].uid;
  const userData = {
    email: userRecord.email || userRecord.providerData[0].email || '',
    displayName: userRecord.displayName || userRecord.providerData[0].displayName || '',
    photoURL: userRecord.photoURL || userRecord.providerData[0].photoURL || ''
  };

  return firestore().collection('users').doc(uid).set(userData);
});

export default saveUserData;
