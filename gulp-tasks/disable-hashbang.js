'use strict';

// Disable hashbang in routing
module.exports = function ($, gulp) { return function () {
  return gulp.src(['dist/elements/elements.vulcanized.js'])
    .pipe($.replace('hashbang:!0', 'hashbang:0'))
    .pipe(gulp.dest('dist/elements'));
};};
