'use strict';

// Minify JavaScript in dist directory
module.exports = function ($, gulp, merge) { return function () {
  var platinumSw = gulp.src('dist/bower_components/platinum-sw/**/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/bower_components/platinum-sw'));

  var promisePolyfill = gulp.src('dist/bower_components/promise-polyfill/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/bower_components/promise-polyfill'));

  var swImport = gulp.src('dist/sw-import.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist'));

  var swToolbox = gulp.src('dist/bower_components/sw-toolbox/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/bower_components/sw-toolbox'));

  return merge(platinumSw, promisePolyfill, swImport, swToolbox);
};};
