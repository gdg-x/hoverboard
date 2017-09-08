module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '/src/**/*',
    '/scripts/**/*',
    '/images/**/*',
    '/data/**/*'
  ],
  navigateFallback: '/index.html',
  directoryIndex: 'index.html',
  navigateFallbackWhitelist: [ /^\/[^\_]+\// ]
};
