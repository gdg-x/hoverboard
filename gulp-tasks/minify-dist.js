'use strict';

// Minify JavaScript in dist directory
module.exports = function ($, config, gulp) { return function () {
  var serviceWorker = gulp.src('dist/bower_components/platinum-sw/service-worker.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/bower_components/platinum-sw'));

  var swImport = gulp.src('dist/sw-import.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist'));

  var swToolbox = gulp.src('dist/sw-toolbox/*.js')
    // TODO
    //.pipe($.uglify()).on('error', errorHandler)
    // https://github.com/mishoo/UglifyJS2/issues/766
    .pipe(gulp.dest('dist/sw-toolbox'));

  return require('merge-stream')(serviceWorker, swImport, swToolbox);
};};
