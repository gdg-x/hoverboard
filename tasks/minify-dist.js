'use strict';

// Minify CSS and JavaScript in dist directory
module.exports = function ($, gulp, merge) { return function () {
  var postcssCssWring = require('csswring');
  var postcssReporter = require('postcss-reporter');

  var index = gulp.src('dist/index.html')
    .pipe($.htmlPostcss([
      // Minify CSS
      postcssCssWring(),
      postcssReporter({
        clearMessages: true
      })
    ]))
    .pipe(gulp.dest('dist'));

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

  return merge(index, platinumSw, promisePolyfill, swImport, swToolbox);
};};
