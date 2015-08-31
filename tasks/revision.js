'use strict';

// Static asset revisioning by appending content hash to filenames
module.exports = function ($, gulp) { return function () {
  // Files without revision hash
  var revAll = new $.revAll({ dontGlobal: [
    /^\/404.html/g,
    /^\/humans.txt/g,
    /^\/robots.txt/g
  // Only revision files in index.html content
  ], dontRenameFile: [
    /^\/index.html/g
  ], dontUpdateReference: [
    /^\/index.html/g
  ]});

  return gulp.src('dist/**')
    .pipe(revAll.revision())
    .pipe(gulp.dest('deploy'))
    .pipe($.size({title: 'deploy'}));
};};
