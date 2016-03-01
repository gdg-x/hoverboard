'use strict';

var ghPages = require('gulp-gh-pages');

// Deploy to GitHub pages
module.exports = function ($, config, gulp, environment) {

  return gulp.src('./dist/**/*').pipe(ghPages());
};
