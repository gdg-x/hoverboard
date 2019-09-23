'use strict';

const gulp = require('gulp');
const path = require('path');
const gulpif = require('gulp-if');
const replace = require('gulp-replace');
const nunjucks = require('gulp-nunjucks');
const requireUncached = require('require-uncached');

function compile(config, polymerJson) {
  let metadata = {};
  for (let file of config.templateData) {
    metadata = Object.assign({}, metadata, requireUncached(path.join(process.cwd(), file)));
  }
  return gulp.src([
    ...polymerJson.sources,
    polymerJson.entrypoint,
  ], { base: '.' })
    .pipe(gulpif(/\.(html|js|json|md)$/, nunjucks.compile(metadata, {
      tags: {
        variableStart: '{$',
        variableEnd: '$}',
      },
    })))
    .pipe(gulpif(/\.(html|js)$/, replace('bower_components', '../bower_components')))
    .pipe(gulpif(/\.(html|js)$/, replace('node_modules', '../node_modules')))
    .pipe(gulp.dest(config.tempDirectory));
}

module.exports = {
  compile: compile,
};
