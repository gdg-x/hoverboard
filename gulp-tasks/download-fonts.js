'use strict';

// Download Google Fonts for load page performance and offline using
module.exports = function ($, gulp) { return function () {
  return gulp.src('./fonts.list')
    .pipe($.googleWebfonts())
    .pipe(gulp.dest('app/fonts'))
    .pipe($.size({title: 'app/fonts'}));
};};
