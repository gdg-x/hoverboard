'use strict';

// Fetch newest Google analytics.js and replace link to analytics.js
// https://www.google-analytics.com/analytics.js have only 2 hours cache
module.exports = function ($, gulp, merge) { return function () {
  var download = $.download('https://www.google-analytics.com/analytics.js')
    .pipe(gulp.dest('dist/scripts'))
    .pipe($.size({title: 'analytics.js'}));

  var replace = gulp.src(['dist/elements/elements.vulcanized.js'])
    .pipe($.replace('//www.google-analytics.com/analytics.js', 'scripts/analytics.js'))
    .pipe(gulp.dest('dist/elements'));

  return merge(download, replace);
};};
