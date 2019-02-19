module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/*.js',
    // Looks like caching old versions of firebase can cause some weirdness.
    // I was getting IndexedDB mismatch problems and commenting out these lines
    // resolved them.
    // https://github.com/firebase/firebase-js-sdk/issues/1339
    // '/bower_components/firebase/firebase.js',
    // '/bower_components/firebase/firebase-firestore.js',
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
