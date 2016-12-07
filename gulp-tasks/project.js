/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const path = require('path');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const polymer = require('polymer-build');

const polymerJSON = require(global.config.polymerJsonPath);
const project = new polymer.PolymerProject(polymerJSON);
const bundledPath = path.join(global.config.build.rootDirectory, global.config.build.bundledDirectory);
const unbundledPath = path.join(global.config.build.rootDirectory, global.config.build.unbundledDirectory);

// This is the heart of polymer-build, and exposes much of the
// work that Polymer CLI usually does for you
// There are tasks to split the source files and dependency files into
// streams, and tasks to rejoin them and output service workers
// You should not need to modify anything in this file
// If you find that you can't accomplish something because of the way
// this module is structured please file an issue
// https://github.com/PolymerElements/generator-polymer-init-custom-build/issues

// Returns a ReadableStream of all the source files
// Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json
function splitSource() {
  return project.sources().pipe(project.splitHtml());
}

// Returns a ReadableStream of all the dependency files
// Dependency files are those in bower_components/**
function splitDependencies() {
  return project.dependencies().pipe(project.splitHtml());
}

// Returns a WriteableStream to rejoin all split files
function rejoin() {
  return project.rejoinHtml();
}

// Returns a function which accepts refernces to functions that generate
// ReadableStreams. These ReadableStreams will then be merged, and used to
// generate the bundled and unbundled versions of the site.
// Takes an argument for the user to specify the kind of output they want
// either bundled or unbundled. If this argument is omitted it will output both
function merge(source, dependencies) {
  return function output() {
    const mergedFiles = mergeStream(source(), dependencies())
      .pipe(project.analyzer);
    const bundleType = global.config.build.bundleType;
    let outputs = [];

    if (bundleType === 'both' || bundleType === 'bundled') {
      outputs.push(writeBundledOutput(polymer.forkStream(mergedFiles)));
    }
    if (bundleType === 'both' || bundleType === 'unbundled') {
      outputs.push(writeUnbundledOutput(polymer.forkStream(mergedFiles)));
    }

    return Promise.all(outputs);
  };
}

// Run the files through a bundling step which will vulcanize/shard them
// then output to the dest dir
function writeBundledOutput(stream) {
  return new Promise(resolve => {
    stream.pipe(project.bundler)
      .pipe(gulp.dest(bundledPath))
      .on('end', resolve);
  });
}

// Just output files to the dest dir without bundling. This is for projects that
// use HTTP/2 server push
function writeUnbundledOutput(stream) {
  return new Promise(resolve => {
    stream.pipe(gulp.dest(unbundledPath))
      .on('end', resolve);
  });
}

// Returns a function which takes an argument for the user to specify the kind
// of bundle they're outputting (either bundled or unbundled) and generates a
// service worker for that bundle.
// If this argument is omitted it will create service workers for both bundled
// and unbundled output
function serviceWorker() {
  const bundleType = global.config.build.bundleType;
  let workers = [];

  if (bundleType === 'both' || bundleType === 'bundled') {
    workers.push(writeBundledServiceWorker());
  }
  if (bundleType === 'both' || bundleType === 'unbundled') {
    workers.push(writeUnbundledServiceWorker());
  }

  return Promise.all(workers);
}

// Returns a Promise to generate a service worker for bundled output
function writeBundledServiceWorker() {
  return polymer.addServiceWorker({
    project: project,
    buildRoot: bundledPath,
    swConfig: global.config.swPrecacheConfig,
    serviceWorkerPath: global.config.serviceWorkerPath,
    bundled: true
  });
}

// Returns a Promise to generate a service worker for unbundled output
function writeUnbundledServiceWorker() {
  return polymer.addServiceWorker({
    project: project,
    buildRoot: unbundledPath,
    swConfig: global.config.swPrecacheConfig,
    serviceWorkerPath: global.config.serviceWorkerPath
  });
}

module.exports = {
  splitSource: splitSource,
  splitDependencies: splitDependencies,
  rejoin: rejoin,
  merge: merge,
  serviceWorker: serviceWorker
};
