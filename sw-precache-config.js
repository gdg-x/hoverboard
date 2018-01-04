module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/*.js',
    '/src/**/*',
    '/scripts/**/*',
    '/data/**/*'
  ],
  navigateFallback: '/index.html',
  directoryIndex: 'index.html',
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
    }]
};
