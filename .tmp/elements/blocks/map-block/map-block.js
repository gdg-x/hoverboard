'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var MapBlock = function () {
    function MapBlock() {
      _classCallCheck(this, MapBlock);
    }

    _createClass(MapBlock, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          images: {
            type: Array,
            /* jshint ignore:start */
            value: ["/images/backgrounds/location_1.jpg", "/images/backgrounds/location_2.jpg", "/images/backgrounds/location_3.jpg"]
            /* jshint ignore:end */
          },
          options: {
            type: String,
            value: function value() {
              return [{
                stylers: [{
                  'lightness': 40
                }, {
                  'visibility': 'on'
                }, {
                  'gamma': 0.9
                }, {
                  'weight': 0.4
                }]
              }, {
                'elementType': 'labels',
                'stylers': [{
                  'visibility': 'on'
                }]
              }, {
                'featureType': 'water',
                'stylers': [{
                  'color': '#5dc7ff'
                }]
              }];
            }
          },
          _currentSourceIndex: {
            type: Number,
            value: 0
          },
          _currentTargetIndex: {
            type: Number,
            value: 0
          },
          _currentImage: {
            type: String
          }
        };
      }
    }, {
      key: 'ready',
      value: function ready() {
        this._currentImage = this.images[this._currentSourceIndex];
        if (this.images.length > 1) {
          var that = this;
          setInterval(function () {
            that.nextImage();
          }, 4000);
        }
      }
    }, {
      key: 'previousImage',
      value: function previousImage() {
        this._currentSourceIndex = this._currentSourceIndex > 0 ? this._currentSourceIndex - 1 : this.images.length - 1;
        this._currentImage = this.images[this._currentSourceIndex];
      }
    }, {
      key: 'nextImage',
      value: function nextImage() {
        this._currentSourceIndex = this._currentSourceIndex < this.images.length - 1 ? this._currentSourceIndex + 1 : 0;
        this._currentImage = this.images[this._currentSourceIndex];
      }
    }]);

    return MapBlock;
  }();

  Polymer(MapBlock);
})();