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

  var args = '';
  if (config.deploy.gae.setDefault) {
    args = '--set-default';
  }

  var deployCmd = 'gcloud preview app deploy -q ' + args + ' --project ' +
    projectID + ' deploy/app.yaml';

  return gulp.src('app.yaml')
    .pipe(gulp.dest('deploy'))
    .pipe($.shell(deployCmd));
};
