/* eslint-env node */

import type { GenerateSWOptions } from 'workbox-build';

const ONE_WEEK = 60 * 60 * 24 * 7;
// Firebase Reserved URLs https://firebase.google.com/docs/hosting/reserved-urls
const FIREBASE_RESERVED_URLS = /^\/__\/.*/;
const FIREBASE_COFIG_URL = '/__/firebase/init.json';
const STATIC_EXPIRATION = {
  maxAgeSeconds: ONE_WEEK,
  maxEntries: 200,
};

export const workboxConfig: GenerateSWOptions = {
  mode: 'debug', // TODO: Remove mode
  swDest: 'dist/service-worker.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [FIREBASE_RESERVED_URLS],
  skipWaiting: true,
  clientsClaim: true,
  offlineGoogleAnalytics: true,
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,svg,md}'],
  runtimeCaching: [
    {
      urlPattern: /\/images\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'images-cache',
        expiration: STATIC_EXPIRATION,
      },
    },
    {
      urlPattern: /https:\/\/maps\.googleapis\.com\/maps.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-maps-cache',
        expiration: STATIC_EXPIRATION,
      },
    },
    {
      urlPattern: FIREBASE_COFIG_URL,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-cache',
        expiration: {
          maxAgeSeconds: ONE_WEEK,
          maxEntries: 10,
        },
      },
    },
    {
      urlPattern: /https:\/\/firebasestorage\.googleapis\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-storage-cache',
        expiration: STATIC_EXPIRATION,
      },
    },
    {
      urlPattern: /https:\/\/storage\.googleapis\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-storage-cache',
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: STATIC_EXPIRATION,
      },
    },
  ],
};
