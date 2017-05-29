module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/*.js'
  ],
  navigateFallback: '/index.html',
  navigateFallbackWhitelist: [/^\/[^\_]+\//],
  runtimeCaching: [
    {
      urlPattern: /\/images\/.*/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 200,
          name: 'items-cache'
        }
      }
    },
    {
      urlPattern: /\/data\/.*json/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 100,
          name: 'data-cache'
        }
      }
    }
  ]
};
