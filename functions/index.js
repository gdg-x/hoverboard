'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Save user data in the Realtime Database when the accounts are created.
exports.saveUserData = functions.auth.user().onCreate(event => {    

    const uid = event.data.uid || event.data.providerData[0].uid;
    const userData = {
        email: event.data.email || event.data.providerData[0].email || '',
        displayName: event.data.displayName || event.data.providerData[0].displayName || '',
        photoURL: event.data.photoURL || event.data.providerData[0].photoURL || ''
    };

    return admin.database().ref(`/users/${uid}`).set(userData);
});