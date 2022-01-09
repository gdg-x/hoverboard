// / <reference lib="WebWorker" />

// @ts-ignore
// eslint-disable-next-line no-undef
declare let self: ServiceWorkerGlobalScope;

import { initializeApp } from 'firebase/app';
import { getMessaging, MessagePayload, onMessage } from 'firebase/messaging';

const buildNotification = (payload: MessagePayload) => {
  const { data } = payload;
  return {
    title: 'Notification',
    ...data,
    data: {
      click_action: data.click_action,
    },
  };
};

fetch('/__/firebase/init.json').then(async (response) => {
  const app = initializeApp(await response.json());
  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    console.log('firebase-messaging-sw.onMessage', { payload });
    const notification = buildNotification(payload);
    return self.registration.showNotification(notification.title, notification);
  });
});

self.addEventListener('notificationclick', (event) => {
  const isPath = event.notification?.data?.click_action?.startsWith('/');
  const url = `${isPath ? self.origin : ''}${event.notification.data.click_action}`;
  event.waitUntil(self.clients.openWindow(url));
});
