'use strict';

const gulp = require('gulp');
const gulpif = require('gulp-if');
const replace = require('gulp-replace');

function normalize(config) {
  return gulp.src(`${config.build.rootDirectory}/${config.tempDirectory}/**/*`,
    {base: `${config.build.rootDirectory}/${config.tempDirectory}`})
    .pipe(gulpif(/\.(html|js)$/, replace('../bower_components', 'bower_components')))
    .pipe(gulpif(/\.(html|js)$/, replace('/.temp', '')))
    .pipe(gulp.dest(config.build.rootDirectory));
}

module.exports = normalize;
