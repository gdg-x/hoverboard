'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.saveUserData = functions.auth.user().onCreate(({ data }) => {
  const uid = data.uid || data.providerData[0].uid;
  const userData = {
    email: data.email || data.providerData[0].email || '',
    displayName: data.displayName || data.providerData[0].displayName || '',
    photoURL: data.photoURL || data.providerData[0].photoURL || ''
  };

  return admin.database().ref(`/users/${uid}`).set(userData);
});
