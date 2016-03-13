'use strict';

// Compile HTML files with Nunjucks templating engine
module.exports = function ($, config, gulp) { return function () {
  var variables = require('../app/themes/' + config.theme + '/variables');
  var metadata = require('../app/metadata/config');
  var general = require('../app/metadata/general');
  var sitedata = require('../app/metadata/sitedata');
  var navigation = require('../app/metadata/navigation');
  var footer = require('../app/metadata/footer');

  function markdownRender(markdown) {
    var cm = require('commonmark');
    var reader = new cm.Parser();
    var writer = new cm.HtmlRenderer();
    var parsed = reader.parse(markdown);
    return writer.render(parsed);
  }

  return gulp.src([
      'app/**/*.html',
      '!app/bower_components/**',
      '!app/test/**',
      '!app/themes/**',
      '!app/views/**'
    ])
    .pipe($.plumber({
      handleError: function (error) {
        console.log(error);
        // For gulp.watch
        // http://blog.ibangspacebar.com/handling-errors-with-gulp-watch-and-gulp-plumber/
        this.emit('end');
      }
    }))
    .pipe($.nunjucksHtml({
      locals: require('merge')(variables, metadata, general, sitedata, navigation, footer),
      searchPaths: ['app/content', 'app/elements', 'app/views'],
      tags: {
        variableStart: '{$',
        variableEnd: '$}'
      },
      setUp: function(env) {
        require('nunjucks-markdown').register(env, markdownRender);
        return env;
      }
    }))
    .pipe(gulp.dest('.tmp'));
};};
