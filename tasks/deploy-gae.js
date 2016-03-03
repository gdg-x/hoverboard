'use strict';

// Deploy to Google App Engine
// GAE requires Google Cloud SDK to be installed and configured.
// For info on SDK: https://cloud.google.com/sdk/
module.exports = function ($, config, gulp, environment) {
  var projectID = null;

  if (environment === 'promote') {
    console.log('Google App Engine don\'t support promote');
    return;
  } else {
    projectID = config.deploy.gae.env[environment];
  }

  var flags = ' ';
  if (config.deploy.gae.promote) {
    flags += '--promote';
  } else {
    flags += '--no-promote';
  }
  
  if (config.deploy.gae.version) {
    flags += ' --version ' + config.version.replace(/\./g, '-');
  }

  var deployCmd = 'gcloud preview app deploy deploy/app.yaml -q --project ' + projectID + flags;

  return gulp.src('').pipe($.shell(deployCmd));
};
