'use strict';

// Static asset revisioning by appending content hash to filenames
module.exports = function ($, gulp) { return function () {
  // Files without revision hash
  var revAll = new $.revAll({ dontGlobal: [
    /^\/404.html/g,
    /^\/google.*.html/g,
    /^\/humans.txt/g,
    /^\/robots.txt/g
  // Only revision files in this file content
  ], dontRenameFile: [
    /^\/app.yaml/g,
    /^\/cache-config.json/g,
    /^\/index.html/g,
    /^\/sw-import.js/g,
    '.markdown',
    '.pdf'
  ], dontUpdateReference: [
    /^\/app.yaml/g,
    /^\/cache-config.json/g,
    /^\/index.html/g,
    /^\/sw-import.js/g,
    '.markdown',
    '.pdf'
  ]});

  return gulp.src('dist/**')
    //.pipe(revAll.revision())
    .pipe(gulp.dest('deploy'))
    .pipe($.size({title: 'deploy'}));
};};
