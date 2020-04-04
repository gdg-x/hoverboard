/* eslint-env node */

import * as path from 'path';

const ONE_WEEK = 60 * 60 * 24 * 7;

export const workboxConfig = {
  swDest: path.join(__dirname, 'dist', 'service-worker.js'),
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    /\/__\/.*/, // Private Firebase URLs
  ],
  skipWaiting: true,
  offlineGoogleAnalytics: true,
  globDirectory: path.join(__dirname, 'dist'),
  globPatterns: ['**/*.{html,js,css,json,svg,md}', 'node_assets/**/*.js'],
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
      urlPattern: /\/node_assets\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'node-modules-cache',
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
