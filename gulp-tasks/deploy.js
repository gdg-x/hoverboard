'use strict';

// Deploy to Firebase or Google Cloud Storage
// GCS requires gsutil to be installed and configured.
// For info on gsutil: https://cloud.google.com/storage/docs/gsutil
// Firebase requires Firebase Command Line Tools to be installed and configured.
// For info on tool: https://www.firebase.com/docs/hosting/command-line-tool.html
module.exports = function ($, config, gulp, environment) { return function () {
  var acl = null;
  var cacheTTL = null;
  var cmds = null;
  var deployCmd = null;
  var removeCmd = null;
  var src = null;
  var dest = null;
  var stream = null;

  if (config.deploy.hosting === 'firebase') {
    if (environment === 'development') {
      dest = config.deploy.firebase.development;
    } else if (environment === 'staging') {
      dest = config.deploy.firebase.staging;
    } else if (environment === 'production') {
      dest = config.deploy.firebase.production;
    } else if (environment === 'promote') {
      console.log('Firebase don\'t support promote');
    }
    deployCmd = 'firebase deploy -f ' + dest;
    removeCmd = 'firebase delete-site -f ' + dest;
    cmds = [removeCmd, deployCmd];
    stream = gulp.src('').pipe($.shell(cmds));

  } else if (config.deploy.hosting === 'gcs') {
    if (environment === 'development') {
      // Set staging specific vars here.
      acl = config.deploy.gcs.acl.development;
      cacheTTL = 0;
      src = 'deploy/*';
      dest = 'gs://' + config.deploy.gcs.bucket.development;
    } else if (environment === 'staging') {
      // Set staging specific vars here.
      acl = config.deploy.gcs.acl.staging;
      cacheTTL = 0;
      src = 'deploy/*';
      dest = 'gs://' + config.deploy.gcs.bucket.staging;
    } else if (environment === 'production') {
      // Set production specific vars here.
      acl = config.deploy.gcs.acl.production;
      cacheTTL = config.deploy.gcs.cacheTTL.production;
      src = 'deploy/*';
      dest = 'gs://' + config.deploy.gcs.bucket.production;
    } else if (environment === 'promote') {
      // Set promote (essentially prod) specific vars here.
      acl = config.deploy.gcs.acl.production;
      cacheTTL = config.deploy.gcs.cacheTTL.production;
      src = 'gs://' + config.deploy.gcs.bucket.staging + '/*';
      dest = 'gs://' + config.deploy.gcs.bucket.production;
    }

    var infoMsg = 'Deploy ' + environment + ' to GCS (' + dest + ') from ' + src;
    process.stdout.write(infoMsg + '\n');

    // Build gsutil command
    var cacheControl = '-h "Cache-Control:public,max-age=' + cacheTTL + '"';
    deployCmd = 'gsutil -m ' + cacheControl +
      ' cp -r -a ' + acl + ' -z css,html,js,json,svg,txt ' + src + ' ' + dest;
    removeCmd = 'gsutil -m rm ' + dest + '/**';
    cmds = [removeCmd, deployCmd];

    // Set cache for files without revision hash
    if (environment === 'production') {
      cacheTTL = config.deploy.gcs.cacheTTL.productionNoCache;
      cacheControl = '-h "Cache-Control:public,max-age=' + cacheTTL + '"';
      var cacheCmd = 'gsutil -m setmeta ' + cacheControl + ' ' +
        dest + '/404.html ' + dest + '/humans.txt ' + dest + '/index.html ' +
        dest + '/robots.txt';
      cmds = [removeCmd, deployCmd, cacheCmd];
    }

    stream = gulp.src('').pipe($.shell(cmds, {ignoreErrors: true}));
  }

  return stream;
};};
