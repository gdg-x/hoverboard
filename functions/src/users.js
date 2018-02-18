import { auth } from 'firebase-functions';
import { database } from 'firebase-admin';

export const saveUserData = auth.user().onCreate(({ data }) => {
  const uid = data.uid || data.providerData[0].uid;
  const userData = {
    email: data.email || data.providerData[0].email || '',
    displayName: data.displayName || data.providerData[0].displayName || '',
    photoURL: data.photoURL || data.providerData[0].photoURL || ''
  };

  return database().ref(`/users/${uid}`).set(userData);
});
