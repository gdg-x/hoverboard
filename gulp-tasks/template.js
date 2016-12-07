'use strict';

const nunjucks = require('gulp-nunjucks');
const requireUncached = require('require-uncached');
const metadata = requireUncached('../data/hoverboard.config');


function compile() {
  return nunjucks.compile(metadata, {
    tags: {
      variableStart: '{$',
      variableEnd: '$}'
    }
  });
}

module.exports = {
  compile: compile
};
