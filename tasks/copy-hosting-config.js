'use strict';

// Copy hosting configuration
module.exports = function ($, config, gulp) { return function () {
  var configFile = '';

  if (config.deploy.hosting === 'gae') {
    configFile = 'app.yaml';
  }

  return gulp.src(configFile)
    .pipe(gulp.dest('dist'));
};};
