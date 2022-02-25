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
import { TempAny } from './temp-any';

const messaging = (self as any).firebase.messaging();

const showNotification = (payload: MessagePayload) => {
  const data = payload.data as TempAny;
  const body = data.body;
  const icon = data.icon;
  const title = data.title;
  const notificationOptions = { body, icon, data };

  return self.registration.showNotification(title, notificationOptions);
};

// This seems to get called when site is closed
messaging.setBackgroundMessageHandler(showNotification);

// This seems to get called when site is open
onBackgroundMessage(messaging, showNotification);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.path));
});
