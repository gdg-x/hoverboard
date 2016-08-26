'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var LatestPosts = function () {
    function LatestPosts() {
      _classCallCheck(this, LatestPosts);
    }

    _createClass(LatestPosts, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          posts: {
            type: Array,
            observer: '_postsChanged'
          },
          _posts: Array
        };
      }
    }, {
      key: '_postsChanged',
      value: function _postsChanged() {
        var temp = this.posts.slice(0, 2);
        for (var i = 0, len = temp.length; i < len; i++) {
          temp[i].url = '/blog/' + temp[i].id;
          temp[i].dataRoute = 'blog/' + temp[i].id;
        }
        this._posts = temp;
      }
    }]);

    return LatestPosts;
  }();

  Polymer(LatestPosts);
})();