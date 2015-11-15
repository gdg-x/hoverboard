'use strict';

// Minify JavaScript in dist directory
module.exports = function ($, gulp, merge) { return function () {
  var bootstrap = gulp.src('dist/elements/bootstrap/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/elements/bootstrap'));

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

  return merge(bootstrap, serviceWorker, swImport, swToolbox);
};};
