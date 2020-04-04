importScripts('./node_assets/firebase/firebase-app.js');
importScripts('./node_assets/firebase/firebase-messaging.js');

firebase.initializeApp({
  apiKey: '{$ firebase.apiKey $}',
  appId: '{$ firebase.appId $}',
  authDomain: '{$ firebase.authDomain $}',
  databaseURL: '{$ firebase.databaseURL $}',
  messagingSenderId: '{$ firebase.messagingSenderId $}',
  projectId: '{$ firebase.projectId $}',
  storageBucket: '{$ firebase.storageBucket $}',
});
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(({ data }) => {
  const notification = Object.assign({}, data, {
    data: {
      click_action: data.click_action,
    },
  });
  return self.registration.showNotification(notification.title, notification);
});

self.addEventListener('notificationclick', (event) => {
  const isPath =
    event.notification.data.click_action && event.notification.data.click_action.startsWith('/');
  const url = isPath
    ? `${self.origin}${event.notification.data.click_action}`
    : event.notification.data.click_action;
  event.waitUntil(clients.openWindow(url));
});
