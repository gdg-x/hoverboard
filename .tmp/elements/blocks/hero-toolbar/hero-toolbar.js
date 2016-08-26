'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var HeroToolbar = function () {
    function HeroToolbar() {
      _classCallCheck(this, HeroToolbar);
    }

    _createClass(HeroToolbar, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          route: {
            type: String,
            notify: true
          },
          backgroundColor: String,
          backgroundImage: String,
          fontColor: String,
          tabBarColor: String,
          video: {
            type: Object,
            value: {}
          }
        };
        this.observers = ['_stylesChanged(backgroundColor, fontColor, tabBarColor)'];
      }
    }, {
      key: 'togglePanel',
      value: function togglePanel() {
        app.toggleDrawer();
      }
    }, {
      key: 'openVideo',
      value: function openVideo() {
        this.fire('iron-signal', {
          name: 'track-event',
          data: {
            category: 'button',
            action: 'click',
            label: 'play ' + this.video.title,
            value: 1
          }
        });
        this.$.videoDialog.open();
      }
    }, {
      key: '_stylesChanged',
      value: function _stylesChanged(backgroundColor, fontColor, tabBarColor) {
        this.customStyle['--hero-background'] = backgroundColor;
        this.customStyle['--hero-color'] = fontColor;
        this.customStyle['--paper-tabs-selection-bar-color'] = tabBarColor;
        document.getElementsByName('theme-color')[0].content = backgroundColor;
        this.updateStyles();
      }
    }]);

    return HeroToolbar;
  }();

  Polymer(HeroToolbar);
})();