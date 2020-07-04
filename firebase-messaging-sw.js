importScripts('/__/firebase/{$ firebaseVersion $}/firebase-app.js');
importScripts('/__/firebase/{$ firebaseVersion $}/firebase-messaging.js');
importScripts('/__/firebase/init.js');

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
