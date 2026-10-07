import type { GenerateSWOptions } from 'workbox-build';

const ONE_WEEK = 60 * 60 * 24 * 7;
// Firebase Reserved URLs https://firebase.google.com/docs/hosting/reserved-urls
const FIREBASE_RESERVED_URLS = /^\/__\/.*/;
const FIREBASE_CONFIG_URL = '/__/firebase/init.json';
// Navigations to file-like paths (sitemap.xml, etc.) must not get the SPA shell.
const FILE_EXTENSION_URLS = /\/[^/?]+\.[^/]+$/;
// Fall back to the cache when the network is slower than this.
const NETWORK_TIMEOUT_SECONDS = 3;
const STATIC_EXPIRATION = {
  maxAgeSeconds: ONE_WEEK,
  maxEntries: 200,
};
// Cross-origin <img> responses are opaque (status 0) and count as ~7MB each against
// storage quota in Chrome, so keep far fewer of them.
const OPAQUE_IMAGE_OPTIONS = {
  cacheableResponse: { statuses: [0, 200] },
  expiration: { maxAgeSeconds: ONE_WEEK, maxEntries: 50 },
};

export const workboxConfig: GenerateSWOptions = {
  swDest: 'dist/service-worker.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [FIREBASE_RESERVED_URLS, FILE_EXTENSION_URLS],
  // Updates activate only after the user accepts the reload prompt.
  skipWaiting: false,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,svg,md}'],
  runtimeCaching: [
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin && url.pathname.startsWith('/images/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images-cache',
        expiration: STATIC_EXPIRATION,
      },
    },
    {
      urlPattern: FIREBASE_CONFIG_URL,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-cache',
        networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
        expiration: {
          maxAgeSeconds: ONE_WEEK,
          maxEntries: 10,
        },
      },
    },
    {
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'firebase-storage-cache', ...OPAQUE_IMAGE_OPTIONS },
    },
    {
      urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-storage-cache', ...OPAQUE_IMAGE_OPTIONS },
    },
  ],
};
