'use strict';

// Add colors to Web Application Manifest - manifest.json
module.exports = function ($, config, gulp) { return function () {
  var variables = require('../app/themes/' + config.appTheme + '/variables');
  var manifest = require('../app/manifest');

  return $.file(
      'manifest.json',
      JSON.stringify(require('merge')(manifest, variables.manifest)),
      { src: true }
    )
    .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('dist'));
};};
