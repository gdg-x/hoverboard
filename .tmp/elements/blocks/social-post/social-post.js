'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var SocialPost = function () {
    function SocialPost() {
      _classCallCheck(this, SocialPost);
    }

    _createClass(SocialPost, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          author: {
            type: String,
            value: 'GDG Lviv'
          },
          url: String,
          text: {
            type: String,
            observer: '_textChanged',
            value: 'Post about your experience at GDG DevFest Season 2015'
          },
          when: Date,
          canonicalUrl: String,
          sign: String
        };
      }
    }, {
      key: '_textChanged',
      value: function _textChanged() {
        this.$.postContent.innerHTML = this.text;
        this.updateStyles();
      }
    }]);

    return SocialPost;
  }();

  Polymer(SocialPost);
})();