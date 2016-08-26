'use strict';

(function () {
  'use strict';

  Polymer.UtilsBehavior = {

    _getIndexByProperty: function _getIndexByProperty(array, property, value) {
      for (var i = 0, length = array.length; i < length; i++) {
        if (array[i][property].toString() === value.toString()) {
          return i;
        }
      }
    },

    _generateClass: function _generateClass(value) {
      return value.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    },

    _randomOrder: function _randomOrder(array) {
      return array.sort(function () {
        return 0.5 - Math.random();
      });
    },

    _toArray: function _toArray(obj) {
      return Object.keys(obj).map(function (key) {
        return obj[key];
      });
    }

  };
})();