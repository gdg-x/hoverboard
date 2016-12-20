'use strict';

const path = require('path');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const browserSync = require('browser-sync').create();
const history = require('connect-history-api-fallback');
const requireUncached = require('require-uncached');

// Got problems? Try logging 'em
// const logging = require('plylog');
// logging.setVerbose();

// !!! IMPORTANT !!! //
// Keep the global.config above any of the gulp-tasks that depend on it
global.config = {
  polymerJsonPath: path.join(process.cwd(), 'polymer.json'),
  build: {
    rootDirectory: 'build',
    bundledDirectory: 'bundled',
    unbundledDirectory: 'unbundled',
    // Accepts either 'bundled', 'unbundled', or 'both'
    // A bundled version will be vulcanized and sharded. An unbundled version
    // will not have its files combined (this is for projects using HTTP/2
    // server push). Using the 'both' option will create two output projects,
    // one for bundled and one for unbundled
    bundleType: 'both'
  },
  // Path to your service worker, relative to the build root directory
  serviceWorkerPath: 'service-worker.js',
  // Service Worker precache options based on
  // https://github.com/GoogleChrome/sw-precache#options-parameter
  swPrecacheConfig: {
    navigateFallback: '/index.html'
  },
  templatePath: [
    'scripts/**/*.js',
    'src/**/*.html',
    'index.html',
    'manifest.json'
  ]
};

// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
const clean = require('./gulp-tasks/clean.js');
const images = require('./gulp-tasks/images.js');
const template = require('./gulp-tasks/template.js');
const project = require('./gulp-tasks/project.js');

// The source task will split all of your source files into one
// big ReadableStream. Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json.
// Because most HTML Imports contain inline CSS and JS, those inline resources
// will be split out into temporary files. You can use gulpif to filter files
// out of the stream and run them through specific tasks. An example is provided
// which filters all images and runs them through imagemin
function source() {
  const metadata = requireUncached('./data/hoverboard.config');
  const resources = requireUncached('./data/en/resources');
  return project.sources()
    .pipe(gulpif('**/*.{html,js,json}', template.compile(Object.assign({}, metadata, resources))))
    .pipe(project.splitHtml())
    // Add your own build tasks here!
    .pipe(gulpif('**/*.{png,gif,jpg,svg}', images.minify()))
    .pipe(project.rejoin()); // Call rejoin when you're finished
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
    .pipe(project.rejoin());
}

function compileTemplate() {
  const metadata = requireUncached('./data/hoverboard.config');
  const resources = requireUncached('./data/en/resources');
  return gulp.src(global.config.templatePath, {base: '.'})
    .pipe(template.compile(Object.assign({}, metadata, resources)));
}

gulp.task('template', gulp.series(clean('.temp'), () => {
  return compileTemplate()
    .pipe(gulp.dest('.temp'));
}));

function reload(done) {
  browserSync.reload();
  done();
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  clean([global.config.build.rootDirectory]),
  project.merge(source, dependencies),
  project.serviceWorker
]));

gulp.task('serve', gulp.series('template', () => {
  browserSync.init({
    logPrefix: 'Hoverboard',
    notify: false,
    server: {
      baseDir: ['.temp', './'],
      middleware: [history()]
    }
  });

  gulp.watch([
    'data/**/*.{markdown,md}',
    'images/**/*.{png,gif,jpg,svg}',
  ]).on('change', reload);

  gulp.watch([
    'data/**/*.json',
    'scripts/**/*.js',
    'src/**/*.html',
    './index.html',
    'manifest.json'
  ], gulp.series('template', reload));
}));
