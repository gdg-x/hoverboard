'use strict';

// Static asset revisioning by appending content hash to filenames
module.exports = function ($, gulp) { return function () {
  var revAll = new $.revAll({ dontRenameFile: [
    // Files without revision hash
    /^\/404.html/g,
    /^\/humans.txt/g,
    /^\/index.html/g,
    /^\/robots.txt/g
  ], dontUpdateReference: [
    // Don't rename index.html in cache-config.json
    /^\/index.html/g
  ]});

  return gulp.src('dist/**')
    .pipe(revAll.revision())
    .pipe(gulp.dest('deploy'))
    .pipe($.size({title: 'deploy'}));
};};
