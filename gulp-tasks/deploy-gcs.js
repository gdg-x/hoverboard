'use strict';

// Deploy to Google Cloud Storage
// GCS requires Google Cloud SDK with gsutil to be installed and configured.
// For info on SDK: https://cloud.google.com/sdk/
module.exports = function ($, config, gulp, environment) {
  var acl = null;
  var cacheTTL = null;
  var cmds = null;
  var src = null;
  var dest = null;

  if (environment === 'promote') {
    // Set promote (essentially prod) specific vars here.
    acl = config.deploy.gcs.acl.production;
    cacheTTL = config.deploy.gcs.cacheTTL.production;
    src = 'gs://' + config.deploy.gcs.env.staging + '/*';
    dest = 'gs://' + config.deploy.gcs.env.production;
  } else {
    acl = config.deploy.gcs.acl[environment];
    cacheTTL = config.deploy.gcs.cacheTTL[environment];
    src = 'deploy/*';
    dest = 'gs://' + config.deploy.gcs.env[environment];
  }

  var infoMsg = 'Deploy ' + environment + ' to GCS (' + dest + ') from ' + src;
  process.stdout.write(infoMsg + '\n');

  // Build gsutil command
  var cacheControl = '-h "Cache-Control:public,max-age=' + cacheTTL + '"';
  var deployCmd = 'gsutil -m ' + cacheControl +
    ' cp -r -a ' + acl + ' -z css,html,js,json,svg,txt ' + src + ' ' + dest;
  var removeCmd = 'gsutil -m rm ' + dest + '/**';
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

  return gulp.src('').pipe($.shell(cmds, {ignoreErrors: true}));
};
