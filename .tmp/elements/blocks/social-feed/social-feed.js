'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var SocialFeed = function () {
    function SocialFeed() {
      _classCallCheck(this, SocialFeed);
    }

    _createClass(SocialFeed, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          source: String,
          interval: {
            type: Number,
            value: 10000
          },
          _posts: {
            type: Array,
            observer: '_postsChanged'
          },
          _selected: {
            type: Number,
            value: -1
          }
        };
      }
    }, {
      key: '_postsChanged',
      value: function _postsChanged() {
        var index = this._selected;
        if (this._posts) {
          this._selected = ++index % this._posts.length;

          /* jshint ignore:start */
          this.author = this._posts[this._selected].user.screen_name;
          this.when = this._posts[this._selected].created_at;
          /* jshint ignore:end */
          this.text = this._linkifyPost(this._posts[this._selected].text);

          this.async(this._postsChanged, this.interval);
        }
      }
    }, {
      key: '_linkifyPost',
      value: function _linkifyPost(value) {
        var replacedText = void 0,
            links1 = void 0,
            links2 = void 0,
            hashtags = void 0,
            profileLinks = void 0;
        links1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = value.replace(links1, '<a class="post-link" href="$1" target="_blank">$1</a>');
        links2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(links2, '$1<a class="post-link" href="http://$2" target="_blank">$2</a>');
        hashtags = /#(\S*)/g;
        replacedText = replacedText.replace(hashtags, '<a class="post-link" href="https://twitter.com/search?q=%23$1" target="_blank">#$1</a>');
        profileLinks = /\B@([\w-]+)/gm;
        replacedText = replacedText.replace(profileLinks, '<a class="post-link" href="https://twitter.com/$1" target="_blank">@$1</a>');
        return replacedText;
      }
    }]);

    return SocialFeed;
  }();

  Polymer(SocialFeed);
})();