'use strict';

const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const cssSlam = require('css-slam').gulp;
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const HtmlSplitter = require('polymer-build').HtmlSplitter;
const browserSync = require('browser-sync').create();
const history = require('connect-history-api-fallback');
const sass = require('gulp-sass');
const flatten = require('gulp-flatten');

const logging = require('plylog');
// logging.setVerbose();

const config = {
  polymerJsonPath: './polymer.json',
  build: {
    rootDirectory: 'build',
    bundled: true
  },
  swPrecacheConfigPath: './sw-precache-config.js',
  templateData: [
    'data/hoverboard.config',
    'data/resources'
  ],
  tempDirectory: '.temp',
  tempCssDirectory: '.css'
};
const swPrecacheConfig = require(config.swPrecacheConfigPath);
const polymerJson = require(config.polymerJsonPath);
const buildPolymerJson = {
  entrypoint: prependPath(config.tempDirectory, polymerJson.entrypoint),
  shell: prependPath(config.tempDirectory, polymerJson.shell),
  fragments: polymerJson.fragments.reduce((res, el) => [...res, prependPath(config.tempDirectory, el)], []),
  sources: polymerJson.sources.reduce((res, el) => [...res, prependPath(config.tempDirectory, el)], []),
  extraDependencies: polymerJson.extraDependencies
};

const normalize = require('./gulp-tasks/normalize.js');
const template = require('./gulp-tasks/template.js');
const images = require('./gulp-tasks/images.js');
const html = require('./gulp-tasks/html.js');


function build() {
  return new Promise(resolve => {
    let polymerProject = null;
    console.log(`Deleting ${config.build.rootDirectory} and ${config.tempDirectory} directories...`);

    del([config.build.rootDirectory, config.tempDirectory, config.tempCssDirectory])
      .then(() => {
        console.log(`Compiling sass...`);
        return waitFor(compileSass());
      })
      .then(() => {
        console.log(`Compiling template...`);

        const compileStream = template.compile(config, polymerJson)
          .on('end', () => {
            polymerProject = new polymerBuild.PolymerProject(buildPolymerJson);
          });
        return waitFor(compileStream);
      })
      .then(() => {
        console.log(`Polymer building...`);

        const sourcesHtmlSplitter = new HtmlSplitter();
        const sourcesStream = polymerProject.sources()
          .pipe(sourcesHtmlSplitter.split())
          // splitHtml doesn't split CSS https://github.com/Polymer/polymer-build/issues/32
          // .pipe(gulpif(/\.js$/, uglify()))
          .pipe(gulpif(/\.(html|css)$/, cssSlam()))
          .pipe(gulpif(/\.html$/, html.minify()))
          .pipe(gulpif(/\.(png|gif|jpg|svg)$/, images.minify()))
          .pipe(sourcesHtmlSplitter.rejoin());

        const dependenciesHtmlSplitter = new HtmlSplitter();
        const dependenciesStream = polymerProject.dependencies()
          .pipe(dependenciesHtmlSplitter.split())
          // Doesn't work for now
          // .pipe(gulpif(/\.js$/, uglify()))
          .pipe(gulpif(/\.(html|css)$/, cssSlam()))
          .pipe(gulpif(/\.html$/, html.minify()))
          .pipe(dependenciesHtmlSplitter.rejoin());

        let buildStream = mergeStream(sourcesStream, dependenciesStream)
          .once('data', () => {
            console.log('Analyzing and optimizing...');
          });

        buildStream = buildStream.pipe(polymerProject.bundler);
        buildStream = buildStream.pipe(gulp.dest(config.build.rootDirectory));
        return waitFor(buildStream);
      })
      .then(() => {
        console.log('Generating the Service Worker...');

        return polymerBuild.addServiceWorker({
          project: polymerProject,
          buildRoot: prependPath(config.build.rootDirectory, config.tempDirectory).replace('\\', '/'),
          bundled: config.build.bundled,
          swPrecacheConfig
        });
      })
      .then(() => {
        console.log('Normalizing...');

        const normalizeStream = normalize(config)
          .on('end', () => {
            del([prependPath(config.build.rootDirectory, config.tempDirectory)])
          });

        return waitFor(normalizeStream);
      })
      .then(() => {
        console.log('Build complete!');
        resolve();
      });
  });
}

function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

function reload(done) {
  browserSync.reload();
  done();
}

function compileSass() {
  return gulp.src('src/**/*.{sass,scss}')
    .pipe(sass().on('error', sass.logError))
    .pipe(flatten())
    .pipe(gulp.dest(config.tempCssDirectory));
}

function compileTemplate() {
  return waitFor(template.compile(config, polymerJson));
}

function prependPath(pre, to) {
  return `${pre}/${to}`;
}

gulp.task('default', build);

gulp.task('serve', gulp.series(() => del([config.tempDirectory, config.tempCssDirectory]),
  compileSass, compileTemplate, () => {
    browserSync.init({
      logPrefix: 'Hoverboard 2',
      notify: false,
      server: {
        baseDir: [config.tempDirectory, './'],
        middleware: [history()]
      }
    });

    gulp.watch([
      'data/**/*.{markdown,md}',
      'images/**/*.{png,gif,jpg,svg}'
    ]).on('change', reload);

    gulp.watch([
      'src/**/*.{sass,scss}'
    ]).on('change', gulp.series(() => del([config.tempDirectory, config.tempCssDirectory]),
      compileSass, compileTemplate, reload));

    gulp.watch([
      'data/**/*.json',
      'scripts/**/*.js',
      'src/**/*.html',
      './index.html',
      'manifest.json'
    ], gulp.series(compileTemplate, reload));
  }));

