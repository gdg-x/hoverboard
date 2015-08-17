/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & Tools We'll Use
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

// Get a task from the tasks directory with default parameters
function getTask(task) {
  return require('./gulp-tasks/' + task)($, config, gulp);
}

// Handle the error
// .pipe(...).on('error', errorHandler)
function errorHandler (error) {
  console.log(error.toString());
}

var styleTask = function (stylesPath, srcs) {
  return gulp.src(srcs.map(function(src) {
      return path.join('app', stylesPath, src);
    }))
    .pipe($.changed(stylesPath, {extension: '.css'}))
    .pipe($.autoprefixer(config.autoprefixer.browsers))
    .pipe(gulp.dest('.tmp/' + stylesPath))
    .pipe($.if('*.css', $.cssmin()))
    .pipe(gulp.dest('dist/' + stylesPath))
    .pipe($.size({title: stylesPath}));
};

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
  return styleTask('styles', ['**/*.css']);
});

gulp.task('elements', function () {
  return styleTask('elements', ['**/*.css']);
});

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src([
      'app/scripts/**/*.js',
      'app/elements/**/*.js',
      'app/elements/**/*.html'
    ])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint.extract()) // Extract JS from .html files
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize Images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function () {
  var app = gulp.src([
    'app/*',
    '!app/test',
    '!app/cache-config.json'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'bower_components/**/*.{css,html,js}',
    '!bower_components/**/index.html',
    '!bower_components/**/{demo,test}/**/*'
  ]).pipe(gulp.dest('dist/bower_components'));

  var elements = gulp.src(['app/elements/**/*.html'])
    .pipe(gulp.dest('dist/elements'));

  var swBootstrap = gulp.src(['bower_components/platinum-sw/bootstrap/*.js'])
    .pipe(gulp.dest('dist/elements/bootstrap'));

  var swToolbox = gulp.src(['bower_components/sw-toolbox/*.js'])
    .pipe(gulp.dest('dist/sw-toolbox'));

  var vulcanized = gulp.src(['app/elements/elements.html'])
    .pipe($.rename('elements.vulcanized.html'))
    .pipe(gulp.dest('dist/elements'));

  return merge(app, bower, elements, vulcanized, swBootstrap, swToolbox)
    .pipe($.size({title: 'copy'}));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function () {
  return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: 'fonts'}));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', 'dist']});

  return gulp.src(['app/**/*.html', '!app/{elements,test}/**/*.html'])
    // Replace path for vulcanized assets
    .pipe($.if('*.html', $.replace('elements/elements.html', 'elements/elements.vulcanized.html')))
    .pipe(assets)
    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // Concatenate And Minify Styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.cssmin()))
    .pipe(assets.restore())
    .pipe($.useref())
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml({
      empty: true,  // KEEP empty attributes
      loose: true,  // KEEP one whitespace
      quotes: true, // KEEP arbitrary quotes
      spare: true   // KEEP redundant attributes
    })))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Vulcanize imports
gulp.task('vulcanize', function () {
  return gulp.src('dist/elements/elements.vulcanized.html')
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
      removeComments: true
    })))
    // Remove newlines from CSS
    //.pipe($.replace(/[\r\n]/g, ''))
    // Remove 2 or more spaces from CSS
    // (single spaces can be syntactically significant)
    .pipe($.if('*.html', $.replace(/ {2,}/g, '')))
    // Remove CSS comments
    .pipe($.if('*.html', $.stripCssComments({preserve: false})))
    // Minify elements.vulcanized.js
    .pipe($.if('*.js', $.uglify()))
    .pipe(gulp.dest('dist/elements'))
    .pipe($.size({title: 'vulcanize'}));
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

  glob('{elements,scripts,styles}/**/*.*', {cwd: dir}, function(error, files) {
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

// Clean Output Directory
gulp.task('clean', function (cb) {
  del(['.tmp', 'dist', 'cdn'], cb);
});

// Clean dist directory
gulp.task('clean-dist', function (cb) {
  del([
    'dist/bower_components/**/*',
    '!dist/bower_components/webcomponentsjs',
    '!dist/bower_components/webcomponentsjs/webcomponents-lite.min.js',
    '!dist/bower_components/platinum-sw',
    '!dist/bower_components/platinum-sw/service-worker.js',
    'dist/styles/app-theme.html',
    'dist/elements/*',
    '!dist/elements/elements.vulcanized.*',
    '!dist/elements/bootstrap'
  ], cb);
});

// Minify JavaScript in dist directory
gulp.task('minify-dist', function () {
  gulp.src(['dist/bower_components/platinum-sw/service-worker.js'])
    .pipe($.uglify())
    .pipe(gulp.dest('dist/bower_components/platinum-sw'));
  gulp.src(['dist/sw-toolbox/*.js'])
    //.pipe($.uglify()).on('error', errorHandler)
    // https://github.com/mishoo/UglifyJS2/issues/766
    .pipe(gulp.dest('dist/sw-toolbox'));
  gulp.src(['dist/sw-import.js'])
    .pipe($.uglify())
    .pipe(gulp.dest('dist'));
});

// Watch Files For Changes & Reload
gulp.task('serve', ['styles', 'elements', 'images'], function () {
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

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/styles/**/*.css'], ['styles', reload]);
  gulp.watch(['app/elements/**/*.css'], ['elements', reload]);
  gulp.watch(['app/{scripts,elements}/**/*.js'], ['jshint']);
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

// Replace text in dist dir
gulp.task('replace-dist', function () {
  return gulp.src(['dist/elements/elements.vulcanized.js'])
    // Disable hashbang in routing
    .pipe($.replace('hashbang:!0', 'hashbang:0'))
    .pipe(gulp.dest('dist/elements'));
});

// Fetch newest Google analytics.js and replace link to analytics.js
// https://www.google-analytics.com/analytics.js have only 2 hours cache
gulp.task('fetch-newest-analytics', getTask('fetch-newest-analytics'));

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  // Uncomment 'cache-config' after 'vulcanize' if you are going to use service workers.
  runSequence(
    ['copy', 'styles'],
    'elements',
    ['jshint', 'images', 'fonts', 'html', 'fetch-newest-analytics'],
    'vulcanize',
    ['clean-dist', 'minify-dist'],
    'cache-config',
    cb);
});

// Static asset revisioning by appending content hash to filenames
gulp.task('revision', function () {
  var revAll = new $.revAll({ dontRenameFile: [
    /^\/404.html/g,
    /^\/humans.txt/g,
    /^\/index.html/g,
    /^\/robots.txt/g
  ], dontUpdateReference: [
    // Don't rename index.html in cache-config.json
    /^\/index.html/g
  ]});
  return gulp.src('dist/**')
    .pipe(revAll.revision())
    .pipe(gulp.dest('cdn'))
    .pipe($.size({title: 'cdn'}));
});

// Deploy to Firebase
// This function requires Firebase Command Line Tools to be installed and configured.
// For info: https://www.firebase.com/docs/hosting/command-line-tool.html
gulp.task('pre-deploy', function(cb) {
  runSequence(
    'default',
    'replace-dist',
    'revision',
    cb);
});

// Development Firebase environment
gulp.task('deploy:dev', ['pre-deploy'], function() {
  return gulp.src('')
    .pipe($.shell('firebase deploy -f ' + config.firebase.development));
});

gulp.task('delete:dev', function() {
  return gulp.src('')
    .pipe($.shell('firebase delete-site -f ' + config.firebase.development));
});

// Staging Firebase environment
gulp.task('deploy:staging', ['pre-deploy'], function() {
  return gulp.src('')
    .pipe($.shell('firebase deploy -f ' + config.firebase.staging));
});

gulp.task('delete:staging', function() {
  return gulp.src('')
    .pipe($.shell('firebase delete-site -f ' + config.firebase.staging));
});

// Production Firebase environment
gulp.task('deploy:prod', ['pre-deploy'], function() {
  return gulp.src('')
    .pipe($.shell('firebase deploy -f ' + config.firebase.production));
});

gulp.task('delete:prod', function() {
  return gulp.src('')
    .pipe($.shell('firebase delete-site -f ' + config.firebase.production));
});

// Tool Tasks
// ----------

// Run PageSpeed Insights
gulp.task('pagespeed', getTask('pagespeed'));

// Test Tasks
// ----------

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
