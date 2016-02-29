'use strict';

// Lint CSS and JavaScript
module.exports = function ($, gulp, merge) { return function () {
  var stylelintConfig = require('../stylelint.config');
  var postcssPlugins = [
    // Lint CSS
    require('stylelint')(stylelintConfig),
    // Lint SUIT CSS methodology
    //require('postcss-bem-linter')(),
    require('postcss-reporter')({
      clearMessages: true
    })
  ];

  var css = gulp.src([
      'app/elements/**/*.css',
      'app/themes/**/*.css',
      '!app/themes/*/fonts/fonts.css'
    ])
    .pipe($.plumber({
      handleError: function (error) {
        console.log(error);
        this.emit('end');
      }
    }))
    .pipe($.postcss(postcssPlugins));

  return merge(css);
};};
