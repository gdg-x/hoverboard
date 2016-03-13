'use strict';

// Deploy to Firebase
// Firebase requires Firebase Command Line Tools to be installed and configured.
// For info on tool: https://www.firebase.com/docs/hosting/command-line-tool.html
module.exports = function ($, config, gulp, environment) {
  var remoteDir = null,
      remoteSymbolicLink = null;

  if (environment === 'promote') {
    console.log('SSH don\'t support promote');
    return;
  } else {
    remoteDir = config.deploy.ssh.env[environment] + '.' + config.version;
    remoteSymbolicLink = config.deploy.ssh.env[environment];
  }

  var port = config.deploy.ssh.port;  
  var remoteServer = config.deploy.ssh.user + '@' + config.deploy.ssh.host;

  return gulp.src('')
    .pipe($.shell('ssh -p ' + port + ' ' + remoteServer + ' mkdir -p ' + remoteDir, {verbose: true}))
    .pipe($.shell('scp -rP ' + port + ' deploy/* ' + remoteServer + ':' + remoteDir, {verbose: true}))
    .pipe($.shell('ssh -p ' + port + ' ' + remoteServer + ' "rm -f ' + remoteSymbolicLink +
                  ' && ln -s ' + remoteDir + ' ' + remoteSymbolicLink + '"', {verbose: true}));
};
