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
var config = require('./config');

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
    '!app/precache.json'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'bower_components/**/*.{css,html,js}',
    '!bower_components/**/{demo,index,metadata}.html'
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
  var DEST_DIR = 'dist/elements';

  return gulp.src('dist/elements/elements.vulcanized.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(gulp.dest(DEST_DIR))
    .pipe($.size({title: 'vulcanize'}));
});

// Generate a list of files that should be precached when serving from 'dist'.
// The list will be consumed by the <platinum-sw-cache> element.
gulp.task('precache', function (callback) {
  var dir = 'dist';

  glob('{elements,scripts,styles}/**/*.*', {cwd: dir}, function(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push('index.html', './', 'bower_components/webcomponentsjs/webcomponents-lite.min.js');
      var filePath = path.join(dir, 'precache.json');
      fs.writeFile(filePath, JSON.stringify(files), callback);
    }
  });
});

// Clean Output Directory
gulp.task('clean', function (cb) {
  del(['.tmp', 'dist'], cb);
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

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence(
    ['copy', 'styles'],
    'elements',
    ['jshint', 'images', 'fonts', 'html'],
    'vulcanize',
    cb);
    // Note: add , 'precache' , after 'vulcanize', if your are going to use Service Worker
});

// Deploy to Google Cloud Storage
// Function to deploy staging or prod version from local tree,
// or to promote staging to prod, per passed arg.
// This function requires gsutil to be installed and configured.
// For info on gsutil: https://cloud.google.com/storage/docs/gsutil.
function deploy(environment) {
  var acl = null;
  var cacheTtl = null;
  var src = null;
  var dest = null;
  if (environment === 'development') {
    // Set staging specific vars here.
    acl = config.cloudStorage.acl.development;
    cacheTtl = 0;
    src = 'dist/*';
    dest = 'gs://' + config.cloudStorage.bucket.development;
  } else if (environment === 'staging') {
    // Set staging specific vars here.
    acl = config.cloudStorage.acl.staging;
    cacheTtl = 0;
    src = 'dist/*';
    dest = 'gs://' + config.cloudStorage.bucket.staging;
  } else if (environment === 'production') {
    // Set production specific vars here.
    acl = config.cloudStorage.acl.production;
    cacheTtl = config.cloudStorage.cacheTtlProduction;
    src = 'dist/*';
    dest = 'gs://' + config.cloudStorage.bucket.production;
  } else if (environment === 'promote') {
    // Set promote (essentially prod) specific vars here.
    acl = config.cloudStorage.acl.production;
    cacheTtl = config.cloudStorage.cacheTtlProduction;
    src = 'gs://' + config.cloudStorage.bucket.staging + '/*';
    dest = 'gs://' + config.cloudStorage.bucket.production;
  }

  var infoMsg = 'Deploy ' + environment + ' to GCS (' + dest + ') from ' + src;
  process.stdout.write(infoMsg + '\n');

  // Build gsutil command
  var cacheControl = '-h "Cache-Control:public,max-age=' + cacheTtl + '"';
  var gsutilCmd = 'gsutil -m ' + cacheControl +
    ' cp -r -a ' + acl + ' -z css,html,js,json,svg,txt ' + src + ' ' + dest;

  gulp.src('').pipe($.shell([gsutilCmd]));
}

// Development Google Cloud Storage bucket
gulp.task('deploy:develop', function() {
  deploy('development');
});

// Staging Google Cloud Storage bucket
gulp.task('deploy:staging', function() {
  deploy('staging');
});

// Production Google Cloud Storage bucket
gulp.task('deploy:prod', function() {
  deploy('production');
});

// Promote the staging version to the production Google Cloud Storage bucket
gulp.task('deploy:promote', function() {
  deploy('promote');
});

// Run PageSpeed Insights
gulp.task('pagespeed', function () {
  return require('psi')(config.pageSpeed.site, {
    nokey: config.pageSpeed.nokey,
    // key: config.pageSpeed.key,
    strategy: config.pageSpeed.strategy
  }, function (err, data) {
    console.log('Site: ' + config.pageSpeed.site);
    console.log('Strategy: ' + config.pageSpeed.strategy);
    if (err) {
      console.log(err);
    } else {
      console.log('Score: ' + data.score);
      console.log(data.pageStats);
    }
  });
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
