import type { GenerateSWOptions } from 'workbox-build';

const ONE_WEEK = 60 * 60 * 24 * 7;
const FIREBASE_CONFIG_URL = '/__/firebase/init.json';
/** Served when a page is neither online nor cached. */
export const OFFLINE_PAGE = '/offline.html';
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

export const workboxConfig: Omit<GenerateSWOptions, 'globDirectory' | 'swDest'> = {
  // Updates activate only after the user accepts the reload prompt.
  skipWaiting: false,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // Other pages are cached when they are visited, so the precache does not grow with the content.
  globPatterns: ['index.html', OFFLINE_PAGE.slice(1), '**/*.{js,css,json,svg,md}'],
  // Locale modules are cached when they first load, so the precache does not grow with every locale.
  globIgnores: ['locales/**'],
  runtimeCaching: [
    {
      // Pages are the site's only URLs without a file extension. Firebase reserves `/__/`. This also
      // matches the client router's fetches, so pages it loads are cached too.
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        !url.pathname.startsWith('/__/') &&
        !/\/[^/]+\.[^/]+$/.test(url.pathname),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
        expiration: { maxAgeSeconds: ONE_WEEK, maxEntries: 50 },
        precacheFallback: { fallbackURL: OFFLINE_PAGE },
      },
    },
    {
      // File names are hashed, so a cached locale never goes stale.
      urlPattern: ({ url }) =>
        url.origin === self.location.origin && url.pathname.startsWith('/locales/'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'locales-cache',
        expiration: STATIC_EXPIRATION,
      },
    },
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
