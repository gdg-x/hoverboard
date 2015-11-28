'use strict';

// Transpile all JS from ES2015 (ES6) to ES5
module.exports = function ($, gulp) { return function () {
  return gulp.src([
      '.tmp/{scripts,elements}/**/*.{js,html}',
      '!.tmp/scripts/analytics.js'
    ])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.if('*.html', $.crisper())) // Extract JS from .html files
    .pipe($.if('*.js', $.babel()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('dist'));
};};
