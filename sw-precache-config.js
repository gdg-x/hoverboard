module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/*.js',
    '/bower_components/firebase/firebase.js',
    '/bower_components/firebase/firebase-firestore.js',
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
  ],
};
