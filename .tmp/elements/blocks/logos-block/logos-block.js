'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var LogosBlock = function () {
    function LogosBlock() {
      _classCallCheck(this, LogosBlock);
    }

    _createClass(LogosBlock, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        var is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.is = is;
        this.properties = {
          logos: Array
        };
      }
    }]);

    return LogosBlock;
  }();

  Polymer(LogosBlock);
})();