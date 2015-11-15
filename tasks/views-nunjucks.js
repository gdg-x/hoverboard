'use strict';

// Compile HTML files with Nunjucks templating engine
module.exports = function ($, config, gulp) { return function () {
  var variables = require('../app/themes/' + config.theme + '/variables');
  var siteConfig = require('../app/settings/config');
  var metadata = require('../app/settings/metadata');
  var sitedata = require('../app/settings/sitedata');
  var navigation = require('../app/settings/navigation');
  var footer = require('../app/settings/footer');

  function markdownRender(markdown) {
    var cm = require('commonmark');
    var reader = new cm.Parser();
    var writer = new cm.HtmlRenderer();
    var parsed = reader.parse(markdown);
    return writer.render(parsed);
  }

  return gulp.src([
      'app/**/*.html', '!app/themes/**/*.html'
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
      locals: require('merge')(variables.html, siteConfig, metadata, sitedata, navigation, footer),
      searchPaths: ['app/views', 'app/elements'],
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
