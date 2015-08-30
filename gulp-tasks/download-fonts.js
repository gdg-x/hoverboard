'use strict';

// Download Google Fonts for load page performance and offline using
module.exports = function ($, gulp) { return function () {
  return gulp.src('./fonts.list')
    .pipe($.googleWebfonts())
    .pipe($.if('*.css', $.replace('url(', 'url(../fonts/')))
    .pipe($.if('*.css', gulp.dest('app/styles')))
    .pipe($.if('*.css', $.size({title: 'app/styles'})))
    .pipe($.if('*.woff', gulp.dest('app/fonts')))
    .pipe($.if('*.woff', $.size({title: 'app/fonts/*.woff'})))
    .pipe($.if('*.woff2', gulp.dest('app/fonts')))
    .pipe($.if('*.woff2', $.size({title: 'app/fonts/*.woff2'})));
};};
