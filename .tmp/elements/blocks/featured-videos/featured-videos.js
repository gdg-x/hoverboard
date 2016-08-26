'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var FeaturedVideos = function () {
    function FeaturedVideos() {
      _classCallCheck(this, FeaturedVideos);
    }

    _createClass(FeaturedVideos, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          videos: {
            type: Array,
            observer: '_videosChanged'
          },
          _videos: Array,
          _selectedVideo: Object
        };
      }
    }, {
      key: '_videosChanged',
      value: function _videosChanged() {
        this._videos = this._randomOrder(this.videos).slice(0, 6);
      }
    }, {
      key: '_playVideo',
      value: function _playVideo(e) {
        this._selectedVideo = {
          title: e.model.video.title + ' by ' + e.model.video.speakers,
          youtubeId: e.model.video.youtubeId
        };
        this.$.videoViewer.open();
      }
    }, {
      key: 'shiftContentLeft',
      value: function shiftContentLeft() {
        var transform = this.$.videos.style.transform;
        var videos = Polymer.dom(this.root).querySelectorAll('.video-item');

        var lastX = transform ? parseInt(transform.split('(')[1].split(',')[0]) : 0;

        var cardRect = videos[videos.length - 1].getBoundingClientRect();
        var cardWidth = cardRect.width;

        var newX = lastX + cardWidth;
        if (newX < cardWidth) {
          this.$.videos.style.transform = 'translate3d(' + newX + 'px, 0, 0)';
        }
      }
    }, {
      key: 'shiftContentRight',
      value: function shiftContentRight() {
        var transform = this.$.videos.style.transform;
        var videos = Polymer.dom(this.root).querySelectorAll('.video-item');

        var lastX = transform ? parseInt(transform.split('(')[1].split(',')[0]) : 0;

        var containerWidth = this.$.videos.getBoundingClientRect().width;
        var cardRect = videos[videos.length - 1].getBoundingClientRect();
        var lastCardLeft = cardRect.left;
        var cardWidth = cardRect.width;

        var newX = lastX - cardWidth;
        if (lastCardLeft > containerWidth) {
          this.$.videos.style.transform = 'translate3d(' + newX + 'px, 0, 0)';
        }
      }
    }, {
      key: 'behaviors',
      get: function get() {
        return [Polymer.UtilsBehavior];
      }
    }]);

    return FeaturedVideos;
  }();

  Polymer(FeaturedVideos);
})();