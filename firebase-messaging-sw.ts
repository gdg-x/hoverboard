/* eslint spaced-comment: ["error", "always", { "markers": ["/"] }] */
/* eslint-env serviceworker */

/// <reference no-default-lib="true"/>
/// <reference lib="ESnext" />
/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare const self: ServiceWorkerGlobalScope;

// TODO: Migrate to v9 with imports
importScripts('/__/firebase/8.10.0/firebase-app.js');
importScripts('/__/firebase/8.10.0/firebase-messaging.js');
// This is currently the only method of loading
importScripts('/__/firebase/init.js');

import { MessagePayload, onBackgroundMessage } from 'firebase/messaging/sw';

const messaging = (self as any).firebase.messaging();

// This seems to get called when site is closed
messaging.setBackgroundMessageHandler((payload: MessagePayload) => {
  const { data } = payload;
  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    data,
  };

  return self.registration.showNotification(`[bg2] ${data.title}`, notificationOptions);
});

// This seems to get called when site is open
onBackgroundMessage(messaging, (payload: MessagePayload) => {
  const { data } = payload;
  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    data,
  };

  self.registration.showNotification(`[bg1] ${data.title}`, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.path));
});
