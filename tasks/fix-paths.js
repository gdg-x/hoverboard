'use strict';

// Fix paths for revision task
module.exports = function ($, gulp, merge, order) { return function () {
  var baseBundle, swToolboxSetup;

  if (order === 'before') {
    baseBundle = gulp.src('dist/elements/base-bundle.js')
      .pipe($.replace('("bootstrap/', '("../bower_components/platinum-sw/bootstrap/'))
      .pipe(gulp.dest('dist/elements'));

    swToolboxSetup = gulp.src('dist/bower_components/platinum-sw/bootstrap/sw-toolbox-setup.js')
      .pipe($.replace('"../sw-toolbox/sw-toolbox.js', '"../../sw-toolbox/sw-toolbox.js'))
      .pipe(gulp.dest('dist/bower_components/platinum-sw/bootstrap'));

  } else if (order === 'after') {
    baseBundle = gulp.src('deploy/elements/base-bundle.*.js')
      .pipe($.replace('("../bower_components/platinum-sw/bootstrap/', '("bootstrap/'))
      .pipe(gulp.dest('deploy/elements'));

    swToolboxSetup = gulp.src('deploy/bower_components/platinum-sw/bootstrap/sw-toolbox-setup.*.js')
      .pipe($.replace('"../../sw-toolbox/sw-toolbox', '"../sw-toolbox/sw-toolbox'))
      .pipe(gulp.dest('deploy/bower_components/platinum-sw/bootstrap'));
  }

  return merge(baseBundle, swToolboxSetup);
};};
