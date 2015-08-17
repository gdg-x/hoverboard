'use strict';

// Static asset revisioning by appending content hash to filenames
module.exports = function ($, config, gulp) { return function () {
  var revAll = new $.revAll({ dontRenameFile: [
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
    .pipe(gulp.dest('cdn'))
    .pipe($.size({title: 'cdn'}));
};};
