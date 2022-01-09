/* eslint-env node */

import type { GenerateSWOptions } from 'workbox-build';

const ONE_WEEK = 60 * 60 * 24 * 7;
const FIREBASE_RESERVED_URLS = /^(?!\/__).*/;

export const workboxConfig: GenerateSWOptions = {
  swDest: 'dist/service-worker.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    FIREBASE_RESERVED_URLS, // Private Firebase URLs
  ],
  skipWaiting: true,
  offlineGoogleAnalytics: true,
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,svg,md}'],
  runtimeCaching: [
    {
      urlPattern: /\/images\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxAgeSeconds: ONE_WEEK,
          maxEntries: 200,
        },
      },
    },
    {
      urlPattern: /https:\/\/maps\.googleapis\.com\/maps.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-maps-cache',
      },
    },
    {
      urlPattern: FIREBASE_RESERVED_URLS,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-cache',
      },
    },
    {
      urlPattern: /https:\/\/firebasestorage\.googleapis\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-storage-cache',
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
      },
    },
  ],
};
