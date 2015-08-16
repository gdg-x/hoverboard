'use strict';

// Run PageSpeed Insights
module.exports = function (config, gulp, plugins) { return function () {
  return require('psi')(config.pageSpeed.site, {
    // key: config.pageSpeed.key,
    nokey: config.pageSpeed.nokey,
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
};};
