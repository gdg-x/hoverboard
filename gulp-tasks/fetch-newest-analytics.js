'use strict';

// Fetch newest Google analytics.js and replace link to analytics.js
// https://www.google-analytics.com/analytics.js have only 2 hours cache
module.exports = function ($, config, gulp) { return function () {
  var download = $.download('https://www.google-analytics.com/analytics.js')
    .pipe(gulp.dest('dist/scripts'))
    .pipe($.size({title: 'analytics.js'}));

  var replace = gulp.src(['dist/bower_components/google-analytics/google-analytics.html'])
    .pipe($.replace('//www.google-analytics.com/analytics.js', 'scripts/analytics.js'))
    .pipe(gulp.dest('dist/bower_components/google-analytics'));

  return require('merge-stream')(download, replace);
};};
