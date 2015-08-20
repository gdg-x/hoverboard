'use strict';

// Static asset revisioning by appending content hash to filenames
module.exports = function ($, gulp) { return function () {
  var revAll = new $.revAll({ dontGlobal: [
    // Files without revision hash
    /^\/404.html/g,
    /^\/humans.txt/g,
    /^\/robots.txt/g
  ]});

  return gulp.src('dist/**')
    .pipe(revAll.revision())
    .pipe(gulp.dest('deploy'))
    .pipe($.size({title: 'deploy'}))
    .pipe(revAll.manifestFile())
    .pipe(gulp.dest('.tmp'));
};};
