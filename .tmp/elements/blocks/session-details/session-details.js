'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'session-details',

    behaviors: [Polymer.PaperDialogBehavior, Polymer.NeonAnimationRunnerBehavior, Polymer.ShareBehavior, Polymer.UtilsBehavior],

    properties: {
      session: {
        type: Object,
        observer: '_sessionChanged'
      }
    },

    listeners: {
      'neon-animation-finish': '_onNeonAnimationFinish'
    },

    _openVideo: function _openVideo() {
      this.$.videoViewer.open();
    },

    _concatArray: function _concatArray(array) {
      return array ? array.join(', ') : '';
    },

    _sessionChanged: function _sessionChanged() {
      var generatedClass = this._generateClass(this.session.mainTag);
      this.customStyle['--paper-scroll-header-panel-color'] = 'var(--' + generatedClass + ')';
      this._previousBrowserColor = document.getElementsByName('theme-color')[0].content;
      document.getElementsByName('theme-color')[0].content = this.getComputedStyleValue('--' + generatedClass);
      this.updateStyles();
    },

    _renderOpened: function _renderOpened() {
      page.redirect('/' + app.route + '/' + this.session.id);
      if (this.withBackdrop && window.innerWidth > 960) {
        this.backdropElement.open();
      }
      this.playAnimation('entry');
      this.async(function () {
        this.$.scrollHeaderPanel.scrollToTop(true);
        this.$.scrollHeaderPanel.notifyResize();
      });
    },

    _renderClosed: function _renderClosed() {
      page.show('/' + app.route, null, false);
      document.getElementsByName('theme-color')[0].content = this._previousBrowserColor;
      this.backdropElement.close();
      this.playAnimation('exit');
    },

    _onNeonAnimationFinish: function _onNeonAnimationFinish() {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        this._finishRenderClosed();
      }
    }

  });
})();