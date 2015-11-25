/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var historyApiFallback = require('connect-history-api-fallback');
var packageJson = require('./package.json');
var crypto = require('crypto');
var config = require('./config');

// Get a task path
function task(filename) {
  return './tasks/' + filename;
}

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src([
      'app/scripts/**/*.js',
      '!app/scripts/analytics.js',
      'app/elements/**/*.js',
      'gulpfile.js'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'Copy optimized images to dist/images dir:'}));
});

// Copy all files at the root level (app)
gulp.task('copy', function () {
  var app = gulp.src([
    'app/*',
    '!app/cache-config.json',
    '!app/content',
    '!app/manifest.json',
    '!app/test',
    '!app/views'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'bower_components/**/*.{css,html,js}',
    '!bower_components/**/index.html',
    '!bower_components/**/{demo,test}/**/*'
  ]).pipe(gulp.dest('dist/bower_components'));

  var elements = gulp.src([
    'app/elements/elements.html',
    'app/elements/routing.html'
  ]).pipe(gulp.dest('dist/elements'));

  var icons = gulp.src(['app/themes/' + config.theme + '/icons.html'])
    .pipe(gulp.dest('dist/themes/' + config.theme));

  var scripts = gulp.src(['app/scripts/analytics.js'])
    .pipe(gulp.dest('dist/scripts'));

  var swBootstrap = gulp.src(['bower_components/platinum-sw/bootstrap/*.js'])
    .pipe(gulp.dest('dist/elements/bootstrap'));

  var swToolbox = gulp.src(['bower_components/sw-toolbox/*.js'])
    .pipe(gulp.dest('dist/sw-toolbox'));

  var vulcanized = gulp.src(['app/elements/elements.html'])
    .pipe($.rename('elements.vulcanized.html'))
    .pipe(gulp.dest('dist/elements'));

  return merge(app, bower, elements, icons, scripts, swBootstrap, swToolbox, vulcanized)
    .pipe($.size({title: 'Copy files to dist dir:'}));
});

// Copy web fonts to dist
gulp.task('fonts', function () {
  return gulp.src(['app/themes/' + config.theme + '/fonts/**/*.{css,woff,woff2}'])
    .pipe(gulp.dest('dist/themes/' + config.theme + '/fonts'))
    .pipe($.size({title: 'Copy fonts to dist/themes/' + config.theme + '/fonts dir:'}));
});

// Scan your HTML for assets & optimize them
gulp.task('html', ['views'], function () {
  var assets = $.useref.assets({searchPath: ['dist']});

  return gulp.src(['app/*.html', '.tmp/*.html'])
    // Replace path for vulcanized assets
    .pipe($.if('*.html', $.replace('elements/elements.html', 'elements/elements.vulcanized.html')))
    .pipe(assets)
    // Concatenate and minify JavaScript
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    .pipe(assets.restore())
    .pipe($.useref())
    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml({
      empty: true,  // KEEP empty attributes
      loose: true,  // KEEP one whitespace
      quotes: true, // KEEP arbitrary quotes
      spare: true   // KEEP redundant attributes
    })))
    // Output files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'Copy optimized html and assets files to dist dir:'}));
});

// Vulcanize granular configuration
gulp.task('vulcanize', function () {
  return gulp.src('dist/elements/elements.vulcanized.html')
    .pipe($.plumber())
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    // Split inline scripts from an HTML file for CSP compliance
    .pipe($.crisper())
    // Minify elements.vulcanized.html
    // https://github.com/PolymerLabs/polybuild/issues/3
    .pipe($.if('*.html', $.htmlmin({
      customAttrAssign: [
        {source:'\\$='}
      ],
      customAttrSurround: [
        [ {source: '\\({\\{'}, {source: '\\}\\}'} ],
        [ {source: '\\[\\['}, {source: '\\]\\]'}  ]
      ],
      removeComments: true,
      collapseWhitespace: true
    })))
    // Remove newline characters
    .pipe($.if('*.html', $.replace(/[\n]/g, '')))
    // Remove 2 or more spaces from CSS
    // (single spaces can be syntactically significant)
    .pipe($.if('*.html', $.replace(/ {2,}/g, '')))
    // Remove CSS comments
    .pipe($.if('*.html', $.stripCssComments({preserve: false})))
    // Minify elements.vulcanized.js
    .pipe($.if('*.js', $.uglify()))
    .pipe(gulp.dest('dist/elements'))
    .pipe($.size({title: 'Copy vulcanized elements to dist/elements dir:'}));
});

// Generate config data for the <sw-precache-cache> element.
// This include a list of files that should be precached, as well as a (hopefully unique) cache
// id that ensure that multiple PSK projects don't share the same Cache Storage.
gulp.task('cache-config', function (callback) {
  var dir = 'dist';
  var config = {
    cacheId: packageJson.name || path.basename(__dirname),
    disabled: false
  };

  return glob('{elements,scripts,themes}/**/*.*', {cwd: dir}, function(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push('index.html', './', 'bower_components/webcomponentsjs/webcomponents-lite.min.js');
      config.precache = files;

      var md5 = crypto.createHash('md5');
      md5.update(JSON.stringify(config.precache));
      config.precacheFingerprint = md5.digest('hex');

      var configPath = path.join(dir, 'cache-config.json');
      fs.writeFile(configPath, JSON.stringify(config), callback);
    }
  });
});

// Clean output directory
gulp.task('clean', function (cb) {
  del(['.tmp', 'dist', 'deploy'], cb);
});

// Watch files for changes & reload
gulp.task('serve', ['images', 'js', 'lint', 'manifest', 'styles', 'views'], function () {
  browserSync({
    browser: config.browserSync.browser,
    https: config.browserSync.https,
    notify: config.browserSync.notify,
    port: config.browserSync.port,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [ historyApiFallback() ],
      routes: {
        '/bower_components': 'bower_components'
      }
    },
    ui: {
      port: config.browserSync.ui.port
    }
  });

  gulp.watch([
    'app/*.html',
    'app/views/**/*.html',
    'app/content/**/*.md'
  ], ['views', reload]);
  gulp.watch(['app/{elements,themes}/**/*.{css,html}'], ['styles', reload]);
  gulp.watch(['app/{scripts,elements}/**/*.{js,html}'], ['jshint', 'js']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
  browserSync({
    browser: config.browserSync.browser,
    https: config.browserSync.https,
    notify: config.browserSync.notify,
    port: config.browserSync.port,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    server: 'dist',
    middleware: [ historyApiFallback() ],
    ui: {
      port: config.browserSync.ui.port
    }
  });
});

// Clean dist directory
gulp.task('clean-dist', require(task('clean-dist'))(del));

// Download newest script analytics.js from Google, because link
// https://www.google-analytics.com/analytics.js has set only 2 hours cache
gulp.task('download:analytics', require(task('download-analytics'))($, gulp));

// Fix path to sw-toolbox.js
gulp.task('fix-path-sw-toolbox', require(task('fix-path-sw-toolbox'))($, gulp));

// Transpile all JS from ES2015 (ES6) to ES5
gulp.task('js', require(task('js-babel'))($, gulp));

// Lint CSS and JavaScript
gulp.task('lint', require(task('lint'))($, gulp, merge));

// Add colors to Web Application Manifest - manifest.json
gulp.task('manifest', require(task('manifest'))($, config, gulp));

// Minify JavaScript in dist directory
gulp.task('minify-dist', require(task('minify-dist'))($, gulp, merge));

// Static asset revisioning by appending content hash to filenames
gulp.task('revision', require(task('revision'))($, gulp));

// Build and serve the output from the dist build with GAE tool
gulp.task('serve:gae', ['default'], require(task('serve-gae'))($, gulp));

// Transform styles with PostCSS
gulp.task('styles', require(task('styles'))($, config, gulp, merge));

// Compile HTML files with Nunjucks templating engine
gulp.task('views', require(task('views-nunjucks'))($, config, gulp));

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence(
    ['copy', 'js', 'jshint', 'lint', 'manifest', 'styles'],
    ['fonts', 'html', 'images'],
    'vulcanize',
    ['clean-dist', 'minify-dist'],
    'cache-config',
    cb);
});

// Initializing app
gulp.task('init', function (cb) {
  runSequence(
    ['download:analytics', 'download:fonts'],
    cb);
});

// Deploy Tasks
// ------------

// Pre-deploy tasks
gulp.task('pre-deploy', function(cb) {
  runSequence(
    'default',
    'fix-path-sw-toolbox',
    'revision',
    cb);
});

// Deploy to development environment
gulp.task('deploy:dev', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'development'));

// Deploy to staging environment
gulp.task('deploy:stag', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'staging'));

// Deploy to production environment
gulp.task('deploy:prod', ['pre-deploy'],
  require(task('deploy'))($, config, gulp, 'production'));

// Promote the staging version to the production environment
gulp.task('deploy:promote',
  require(task('deploy'))($, config, gulp, 'promote'));

// Tool Tasks
// ----------

// Download Google Fonts for load page performance and offline using
gulp.task('download:fonts', require(task('download-fonts'))($, config, gulp));

// Run PageSpeed Insights
gulp.task('pagespeed', require(task('pagespeed'))(config));

// Test Tasks
// ----------

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks/tests'); } catch (err) {}
