// 'use strict';
//
// const path = require('path');
// const gulp = require('gulp');
// const gulpif = require('gulp-if');
// const uglify = require('gulp-uglify');
// const cssSlam = require('css-slam').gulp;
// const htmlmin = require('gulp-htmlmin');
// const browserSync = require('browser-sync').create();
// const history = require('connect-history-api-fallback');
// const requireUncached = require('require-uncached');
//
// Got
// problems ? Try logging
// 'em
// const logging = require('plylog');
// logging.setVerbose();
//
//
// global.config = {
//   polymerJsonPath: path.join(process.cwd(), 'polymer.json'),
//   build: {
//     rootDirectory: 'build',
//     bundledDirectory: 'bundled',
//     unbundledDirectory: 'unbundled',
//     // Accepts either 'bundled', 'unbundled', or 'both'
//     // A bundled version will be vulcanized and sharded. An unbundled version
//     // will not have its files combined (this is for projects using HTTP/2
//     // server push). Using the 'both' option will create two output projects,
//     // one for bundled and one for unbundled
//     bundleType: 'both'
//   },
//   // Path to your service worker, relative to the build root directory
//   serviceWorkerPath: 'service-worker.js',
//   // Service Worker precache options based on
//   // https://github.com/GoogleChrome/sw-precache#options-parameter
//   swPrecacheConfig: {
//     staticFileGlobs: [
//       '/index.html',
//       '/manifest.json',
//       '/bower_components/webcomponentsjs/webcomponents-lite.min.js',
//       '/src/**/*',
//       '/scripts/**/*',
//       '/images/**/*',
//       '/data/**/*'
//     ],
//     navigateFallback: '/index.html',
//     navigateFallbackWhitelist: [/^\/[^\_]+\//]
//   },
//   templatePath: [
//     'scripts/**/*.js',
//     'src/**/*.html',
//     'index.html',
//     'manifest.json'
//   ]
// };
//
// const clean = require('./gulp-tasks/clean.js');
// const images = require('./gulp-tasks/images.js');
// const template = require('./gulp-tasks/template.js');
// const project = require('./gulp-tasks/project.js');
//
// // The source task will split all of your source files into one
// // big ReadableStream. Source files are those in src/** as well as anything
// // added to the sourceGlobs property of polymer.json.
// // Because most HTML Imports contain inline CSS and JS, those inline resources
// // will be split out into temporary files. You can use gulpif to filter files
// // out of the stream and run them through specific tasks. An example is provided
// // which filters all images and runs them through imagemin
// function source() {
//   const metadata = requireUncached('./data/hoverboard.config');
//   const resources = requireUncached('./data/en/resources');
//   return project.sources()
//     .pipe(gulpif('**/*.{html,js,json}', template.compile(Object.assign({}, metadata, resources))))
//     .pipe(project.splitHtml())
//     // Add your own build tasks here!
//     // splitHtml doesn't split CSS https://github.com/Polymer/polymer-build/issues/32
//     .pipe(gulpif(/\.js$/, uglify()))
//     .pipe(gulpif('**/*.{html,css}', cssSlam()))
//     .pipe(gulpif(/\.html$/, htmlmin({
//       caseSensitive: true,
//       collapseWhitespace: true,
//       collapseInlineTagWhitespace: true,
//       removeComments: true,
//       removeCommentsFromCDATA: true,
//       customAttrAssign: [/\$=/],
//       customAttrSurround: [
//         [{'source': '\\({\\{'}, {'source': '\\}\\}'}],
//         [{'source': '\\[\\['}, {'source': '\\]\\]'}]
//       ]
//     })))
//     .pipe(gulpif('**/*.{png,gif,jpg,svg}', images.minify()))
//     .pipe(project.rejoin()); // Call rejoin when you're finished
// }
//
// // The dependencies task will split all of your bower_components files into one
// // big ReadableStream
// // You probably don't need to do anything to your dependencies but it's here in
// // case you need it :)
// function dependencies() {
//   return project.splitDependencies()
//   // Doesn't work for now
//   // .pipe(gulpif(/\.js$/, uglify()))
//     .pipe(gulpif('**/*.{html,css}', cssSlam()))
//     .pipe(gulpif(/\.html$/, htmlmin({
//       caseSensitive: true,
//       collapseWhitespace: true,
//       collapseInlineTagWhitespace: true,
//       removeComments: true,
//       removeCommentsFromCDATA: true,
//       customAttrAssign: [/\$=/],
//       customAttrSurround: [
//         [{'source': '\\({\\{'}, {'source': '\\}\\}'}],
//         [{'source': '\\[\\['}, {'source': '\\]\\]'}]
//       ]
//     })))
//     .pipe(project.rejoin());
// }
//
// function compileTemplate() {
//   const metadata = requireUncached('./data/hoverboard.config');
//   const resources = requireUncached('./data/en/resources');
//   return gulp.src(global.config.templatePath, {base: '.'})
//     .pipe(template.compile(Object.assign({}, metadata, resources)));
// }
//
// gulp.task('template', gulp.series(clean('.temp'), () => {
//   return compileTemplate()
//     .pipe(gulp.dest('.temp'));
// }));
//
// function reload(done) {
//   browserSync.reload();
//   done();
// }
//
// // Clean the build directory, split all source and dependency files into streams
// // and process them, and output bundled and unbundled versions of the project
// // with their own service workers
// gulp.task('default', gulp.series([
//   clean([global.config.build.rootDirectory]),
//   project.merge(source, dependencies),
//   project.serviceWorker
// ]));
//
//


const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const cssSlam = require('css-slam').gulp;
const htmlmin = require('gulp-htmlmin');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const requireUncached = require('require-uncached');
const replace = require('gulp-replace');
const browserSync = require('browser-sync').create();
const history = require('connect-history-api-fallback');

const logging = require('plylog');
// logging.setVerbose();

const config = {
  polymerJsonPath: './polymer.json',
  build: {
    rootDirectory: 'build',
    bundleType: 'bundled'
  },
  serviceWorkerPath: 'service-worker.js',
  swPrecacheConfigPath: './sw-precache-config.js',
  templateData: [
    './data/hoverboard.config',
    './data/en/resources'
  ],
  tempDirectory: '.temp'
};
const swPrecacheConfig = require(config.swPrecacheConfigPath);
const polymerJson = require(config.polymerJsonPath);
const buildPolymerJson = {
  entrypoint: `${config.tempDirectory}/${polymerJson.entrypoint}`,
  shell: `${config.tempDirectory}/${polymerJson.shell}`,
  fragments: polymerJson.fragments.reduce((res, el) => [...res, `${config.tempDirectory}/${el}`], []),
  sources: polymerJson.sources.reduce((res, el) => [...res, `${config.tempDirectory}/${el}`], []),
  extraDependencies: polymerJson.extraDependencies
};
const template = require('./gulp-tasks/template.js');


function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

function compileTemplate() {
  let metadata = {};
  for (let file of config.templateData) {
    metadata = Object.assign({}, metadata, requireUncached(file));
  }
  console.log(`Compiling...`);
  let compileStream = gulp.src([
    ...polymerJson.sources,
    polymerJson.entrypoint
  ], {base: '.'})
    .pipe(gulpif(/\.(html|js|json)$/, template.compile(metadata)))
    .pipe(gulpif(/\.(html|js)$/, replace('bower_components', '../bower_components')))
    .pipe(gulp.dest(config.tempDirectory));
  return waitFor(compileStream);
}

function build() {
  return new Promise((resolve, reject) => {
    let polymerProject = null;
    console.log(`Deleting ${config.build.rootDirectory} and ${config.tempDirectory} directories...`);
    del([config.build.rootDirectory, config.tempDirectory])
      .then(compileTemplate)
      .then(() => {
        polymerProject = new polymerBuild.PolymerProject(buildPolymerJson);
        console.log(`Polymer building...`);
        let sourcesStream = polymerProject.sources()
          .pipe(polymerProject.splitHtml())
          // splitHtml doesn't split CSS https://github.com/Polymer/polymer-build/issues/32
          .pipe(gulpif(/\.js$/, uglify()))
          .pipe(gulpif(/\.(html|css)$/, cssSlam()))
          .pipe(gulpif(/\.html$/, htmlmin({
            caseSensitive: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            removeComments: true,
            removeCommentsFromCDATA: true,
            customAttrAssign: [/\$=/],
            customAttrSurround: [
              [{'source': '\\({\\{'}, {'source': '\\}\\}'}],
              [{'source': '\\[\\['}, {'source': '\\]\\]'}]
            ]
          })))
          .pipe(gulpif(/\.(png|gif|jpg|svg)$/, imagemin({
            progressive: true,
            interlaced: true
          })))
          .pipe(polymerProject.rejoinHtml());

        let dependenciesStream = polymerProject.dependencies()
          .pipe(polymerProject.splitHtml())
          // Doesn't work for now
          // .pipe(gulpif(/\.js$/, uglify()))
          .pipe(gulpif(/\.(html|css)$/, cssSlam()))
          .pipe(gulpif(/\.html$/, htmlmin({
            caseSensitive: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            removeComments: true,
            removeCommentsFromCDATA: true,
            customAttrAssign: [/\$=/],
            customAttrSurround: [
              [{'source': '\\({\\{'}, {'source': '\\}\\}'}],
              [{'source': '\\[\\['}, {'source': '\\]\\]'}]
            ]
          })))
          .pipe(polymerProject.rejoinHtml());

        let buildStream = mergeStream(sourcesStream, dependenciesStream)
          .once('data', () => {
            console.log('Analyzing build dependencies...');
          });

        buildStream = buildStream.pipe(polymerProject.bundler);
        buildStream = buildStream.pipe(gulp.dest(config.build.rootDirectory));
        return waitFor(buildStream);
      })
      .then(() => {
        console.log('Generating the Service Worker...');
        return polymerBuild.addServiceWorker({
          project: polymerProject,
          buildRoot: `${config.build.rootDirectory}/${config.tempDirectory}`.replace('\\', '/'),
          bundled: true,
          swPrecacheConfig
          // swPrecacheConfig: {
          //   staticFileGlobs: swPrecacheConfig.staticFileGlobs.reduce((res, el) => [...res, `${config.tempDirectory}/${el}`], []),
          //   navigateFallback: `${config.tempDirectory}/${swPrecacheConfig.navigateFallback}`,
          //   navigateFallbackWhitelist: swPrecacheConfig.navigateFallbackWhitelist
          // }
        });
      })
      .then(() => {
        console.log('Normalizing...');
        let normalizeStream = gulp.src(`${config.build.rootDirectory}/${config.tempDirectory}/**/*`,
          {base: `${config.build.rootDirectory}/${config.tempDirectory}`})
          .pipe(gulpif(/\.(html|js)$/, replace('../bower_components', 'bower_components')))
          .pipe(gulpif(/\.(html|js)$/, replace('/.temp', '')))
          .pipe(gulp.dest(config.build.rootDirectory));
        return waitFor(normalizeStream);
      })
      .then(() => {
        del([`${config.build.rootDirectory}/${config.tempDirectory}`])
      })
      .then(() => {
        console.log('Build complete!');
        resolve();
      });
  });
}

gulp.task('default', build);
gulp.task('serve', gulp.series(compileTemplate, () => {
  browserSync.init({
    logPrefix: 'Hoverboard',
    notify: false,
    server: {
      baseDir: [config.tempDirectory, './'],
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
  ], gulp.series(compileTemplate, reload));
}));

