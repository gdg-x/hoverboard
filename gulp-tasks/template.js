'use strict';

const nunjucks = require('gulp-nunjucks');

function compile(metadata) {
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
