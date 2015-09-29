'use strict';

// Clean dist directory
module.exports = function (del) { return function (cb) {
  del([
    'dist/bower_components/**/*',
    '!dist/bower_components/webcomponentsjs',
    '!dist/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '!dist/bower_components/platinum-sw',
    '!dist/bower_components/platinum-sw/service-worker.js',
    'dist/elements/*',
    '!dist/elements/elements.vulcanized.*',
    '!dist/elements/bootstrap',
    'dist/scripts/**/*.map',
    'dist/themes/*/*.{html,map}',
    'dist/themes/*/fonts/fonts.css'
  ], cb);
};};
