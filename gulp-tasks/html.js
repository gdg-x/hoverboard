'use strict';

const htmlmin = require('gulp-htmlmin');

function minify() {
  return htmlmin({
    caseSensitive: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
    removeCommentsFromCDATA: true,
    customAttrAssign: [/\$=/],
    customAttrSurround: [
      [{'source': '\\({\\{'}, {'source': '\\}\\}'}],
      [{'source': '\\[\\['}, {'source': '\\]\\]'}]
    ]
  });
}

module.exports = {
  minify
};
