'use strict';

// Fix path to sw-toolbox.js
module.exports = function ($, gulp) { return function () {
  return gulp.src('dist/elements/bootstrap/sw-toolbox-setup.js')
    .pipe($.replace('"../sw-toolbox/sw-toolbox.js', '"../../sw-toolbox/sw-toolbox.js'))
    .pipe(gulp.dest('dist/elements/bootstrap'));
};};
