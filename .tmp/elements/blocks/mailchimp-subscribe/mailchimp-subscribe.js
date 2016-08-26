'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var MailchimpSubscribe = function () {
    function MailchimpSubscribe() {
      _classCallCheck(this, MailchimpSubscribe);
    }

    _createClass(MailchimpSubscribe, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          url: String,
          name: String
        };
      }
    }, {
      key: 'submitForm',
      value: function submitForm() {
        this.$$('#mc-embedded-subscribe-form').submit();
      }
    }]);

    return MailchimpSubscribe;
  }();

  Polymer(MailchimpSubscribe);
})();