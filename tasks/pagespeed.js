'use strict';

// Run PageSpeed Insights
module.exports = function (config) { return function () {
  return require('psi').output(config.pageSpeed.site, {
    // key: config.pageSpeed.key,
    nokey: config.pageSpeed.nokey,
    strategy: config.pageSpeed.strategy
  }, function (err) {
    if (err) {
      console.log(err);
    }
  });
};};
