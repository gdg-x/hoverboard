'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var BlogPage = function () {
    function BlogPage() {
      _classCallCheck(this, BlogPage);
    }

    _createClass(BlogPage, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          posts: Array,
          selected: {
            type: Boolean,
            observer: 'updateHeroSettings'
          },
          heroSettings: {
            type: Object,
            notify: true
          },
          _heroSettings: {
            type: Object,
            /* jshint ignore:start */
            value: function value() {
              return;
            }
            /* jshint ignore:end */
          },

          animationConfig: {
            type: Object,
            value: function value() {
              return {
                'entry': [{
                  name: 'cascaded-animation',
                  animation: 'transform-animation',
                  transformFrom: 'translate3d(0, 100%, 0)',
                  timing: {
                    delay: 500
                  }
                }, {
                  name: 'fade-in-animation',
                  animation: 'fade-in-animation',
                  node: this,
                  timing: {
                    delay: 500
                  }
                }],
                'exit': [{
                  name: 'cascaded-animation',
                  animation: 'transform-animation',
                  transformTo: 'translate3d(0, 100%, 0)'
                }, {
                  name: 'fade-out-animation',
                  animation: 'fade-out-animation',
                  node: this
                }]
              };
            }
          }
        };
        this.observers = ['updateHeroSettings(selected)'];
      }
    }, {
      key: 'updateHeroSettings',
      value: function updateHeroSettings() {
        this.heroSettings = this.selected ? this._heroSettings : this.heroSettings;
      }
    }, {
      key: '_updateCascadedNodes',
      value: function _updateCascadedNodes() {
        var cascaded = Polymer.dom(this.root).querySelectorAll('[cascaded]');
        var cascadedArray = Array.prototype.slice.call(cascaded);
        this.animationConfig.entry[0].nodes = cascadedArray;
        this.animationConfig.exit[0].nodes = cascadedArray;
      }
    }, {
      key: 'behaviors',
      get: function get() {
        return [Polymer.NeonSharedElementAnimatableBehavior];
      }
    }]);

    return BlogPage;
  }();

  Polymer(BlogPage);
})();