'use strict';

// Build and serve the output from the dist build with GAE tool
module.exports = function ($, gulp) { return function () {
  return gulp.src('app.yaml')
    .pipe(gulp.dest('dist'))
    .pipe($.shell('gcloud preview app run dist/app.yaml'));
};};
