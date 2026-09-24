/* eslint spaced-comment: ["error", "always", { "markers": ["/"] }] */

/// <reference no-default-lib="true"/>
/// <reference lib="ESnext" />
/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare const self: ServiceWorkerGlobalScope;

import { FirebaseOptions, initializeApp } from 'firebase/app';
import { MessagePayload, getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Capture the config object from /__/firebase/init.js
let firebaseConfig: FirebaseOptions | undefined;
(self as unknown as { firebase: { initializeApp: (config: FirebaseOptions) => void } }).firebase = {
  initializeApp: (config) => {
    firebaseConfig = config;
  },
};
importScripts('/__/firebase/init.js');

if (!firebaseConfig) {
  throw new Error('firebaseConfig is not defined');
}

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

const showNotification = (payload: MessagePayload) => {
  const data = payload.data ?? {};
  const body = data['body'] ?? '';
  const icon = data['icon'] ?? '';
  const title = data['title'] ?? '';
  const notificationOptions = { body, icon, data };

  return self.registration.showNotification(title, notificationOptions);
};

onBackgroundMessage(messaging, showNotification);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data?.path;
  if (path) {
    event.waitUntil(self.clients.openWindow(path));
  }
});
