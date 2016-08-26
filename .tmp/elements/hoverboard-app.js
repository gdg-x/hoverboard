'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var HoverboardApp = function () {
    function HoverboardApp() {
      _classCallCheck(this, HoverboardApp);
    }

    _createClass(HoverboardApp, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          route: {
            type: String,
            value: 'home'
          },
          params: Object,
          upgraded: Boolean
        };
      }
    }, {
      key: 'ready',
      value: function ready() {
        this.fire('upgraded');
        this.upgraded = true;
      }
    }, {
      key: 'scrollPageToTop',
      value: function scrollPageToTop() {
        this.$.headerPanelMain.scrollToTop(true);
      }
    }, {
      key: 'closeDrawer',
      value: function closeDrawer() {
        this.$.paperDrawerPanel.closeDrawer();
      }
    }, {
      key: 'toggleDrawer',
      value: function toggleDrawer() {
        this.$.paperDrawerPanel.togglePanel();
      }
    }]);

    return HoverboardApp;
  }();

  Polymer(HoverboardApp);
})();