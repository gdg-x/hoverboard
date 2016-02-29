'use strict';

// Download Google Fonts for load page performance and offline using
module.exports = function ($, config, gulp) { return function () {
  return gulp.src('./app/themes/' + config.theme + '/fonts.list')
    .pipe($.googleWebfonts())
    .pipe(gulp.dest('./app/themes/' + config.theme + '/fonts'))
    .pipe($.if('*.woff',
      $.size({title: 'Copy downloaded WOFF fonts to app/themes/' +
        config.theme + '/fonts dir:'})
    ))
    .pipe($.if('*.woff2',
      $.size({title: 'Copy downloaded WOFF2 fonts to app/themes/' +
        config.theme + '/fonts dir:'})
    ));
};};
