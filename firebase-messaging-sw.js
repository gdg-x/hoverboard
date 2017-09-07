importScripts('bower_components/firebase/firebase-app.js');
importScripts('bower_components/firebase/firebase-messaging.js');
firebase.initializeApp({
  messagingSenderId: '{$ firebase.messagingSenderId $}'
});
firebase.messaging();
