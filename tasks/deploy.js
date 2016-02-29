'use strict';

// Deploy function
module.exports = function ($, config, gulp, environment) { return function () {
  if (config.deploy.hosting === 'firebase') {
    return require('./deploy-firebase')($, config, gulp, environment);

  } else if (config.deploy.hosting === 'gae') {
    return require('./deploy-gae')($, config, gulp, environment);

  } else if (config.deploy.hosting === 'gcs') {
    return require('./deploy-gcs')($, config, gulp, environment);

  } else if (config.deploy.hosting === 'ssh') {
    return require('./deploy-ssh')($, config, gulp, environment);
  }
};};
