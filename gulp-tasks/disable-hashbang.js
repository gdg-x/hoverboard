'use strict';

// Disable hashbang in routing
module.exports = function ($, config, gulp) { return function () {
  return gulp.src(['dist/elements/elements.vulcanized.js'])
    .pipe($.if(config.deploy.hosting === 'firebase',
      $.replace('hashbang:!0', 'hashbang:0')))
    .pipe(gulp.dest('dist/elements'));
};};
