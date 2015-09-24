'use strict';

// Add colors to Web Application Manifest - manifest.json
module.exports = function ($, config, gulp) { return function () {
  var variables = require('../app/themes/' + config.theme + '/variables');
  var manifest = require('../app/manifest');

  return gulp.src('')
    .pipe($.file('manifest.json', JSON.stringify(require('merge')(manifest, variables.manifest))))
    .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('dist'));
};};
