module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/node_modules/@webcomponents/webcomponentsjs/*.js',
    '/node_modules/firebase/firebase.js',
    '/node_modules/firebase/firebase-firestore.js',
    '/images/**/*',
    '/scripts/**/*',
    '/data/**/*',
    '/src/**/*',
  ],
  navigateFallback: '/index.html',
  directoryIndex: 'index.html',
  navigateFallbackWhitelist: [/^\/[^\_]+\//],
  runtimeCaching: [
    {
      urlPattern: /\/images\/.*/,
      handler: 'networkFirst',
      options: {
        cache: {
          maxEntries: 200,
          name: 'items-cache',
        },
      },
    },
    {
      urlPattern: /\/bower_components\/.*/,
      handler: 'cacheFirst',
      options: {
        cache: {
          name: 'bower-components-cache',
        },
      },
    },
    {
      urlPattern: /\/node_modules\/.*/,
      handler: 'cacheFirst',
      options: {
        cache: {
          name: 'node-modules-cache',
        },
      },
    },
    {
      urlPattern: /https:\/\/maps\.googleapis\.com\/maps.*/,
      handler: 'cacheFirst',
      options: {
        cache: {
          name: 'google-maps-cache',
        },
      },
    },
  ],
};
