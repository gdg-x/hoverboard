// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
import { auth } from 'firebase-functions';

export const saveUserData = auth.user().onCreate((userRecord) => {
  const uid = userRecord.uid || userRecord.providerData[0].uid;
  const userData = {
    email: userRecord.email || userRecord.providerData[0].email || '',
    displayName: userRecord.displayName || userRecord.providerData[0].displayName || '',
    photoURL: userRecord.photoURL || userRecord.providerData[0].photoURL || '',
  };

  return getFirestore().collection('users').doc(uid).set(userData);
});
