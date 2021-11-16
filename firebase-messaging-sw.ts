// / <reference lib="WebWorker" />

// @ts-ignore
declare let self: ServiceWorkerGlobalScope;

import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';

const app = initializeApp({
  apiKey: '{$ firebase.apiKey $}',
  appId: '{$ firebase.appId $}',
  authDomain: '{$ firebase.authDomain $}',
  databaseURL: '{$ firebase.databaseURL $}',
  messagingSenderId: '{$ firebase.messagingSenderId $}',
  projectId: '{$ firebase.projectId $}',
  storageBucket: '{$ firebase.storageBucket $}',
});
const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  const { data } = payload;
  const notification = {
    ...{
      title: 'Notification',
    },
    ...data,
    ...{
      data: {
        click_action: data.click_action,
      },
    },
  };
  return self.registration.showNotification(notification.title, notification);
});

self.addEventListener('notificationclick', (event) => {
  const isPath = event.notification?.data?.click_action?.startsWith('/');
  const url = `${isPath ? self.origin : ''}${event.notification.data.click_action}`;
  event.waitUntil(self.clients.openWindow(url));
});
