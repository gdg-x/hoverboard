'use strict';

// Deploy to Firebase
// Firebase requires Firebase Command Line Tools to be installed and configured.
// For info on tool: https://www.firebase.com/docs/hosting/command-line-tool.html
module.exports = function ($, config, gulp, environment) {
  var subdomain = null;

  if (environment === 'promote') {
    console.log('Firebase don\'t support promote');
    return;
  } else {
    subdomain = config.deploy.firebase.env[environment];
  }

  return gulp.src('').pipe($.shell('firebase deploy -f ' + subdomain));
};
