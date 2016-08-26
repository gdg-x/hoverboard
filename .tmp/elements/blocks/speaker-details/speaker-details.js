'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'speaker-details',

    behaviors: [Polymer.PaperDialogBehavior, Polymer.NeonAnimationRunnerBehavior, Polymer.UtilsBehavior],

    properties: {
      speaker: {
        type: Object,
        observer: '_speakerChanged'
      }
    },

    listeners: {
      'neon-animation-finish': '_onNeonAnimationFinish'
    },

    ready: function ready() {
      var title = this.$.title;
      addEventListener('paper-header-transform', function (e) {
        var d = e.detail;
        var m = d.height - d.condensedHeight;
        var transform = 40 * (d.y / m > 1 ? 1 : d.y / m);
        Polymer.Base.translate3d(transform + 'px', 0, 0, title);
      });
    },

    _speakerChanged: function _speakerChanged() {
      var generatedClass = this._generateClass(this.speaker.tags[0]);
      this.customStyle['--paper-scroll-header-panel-color'] = 'var(--' + generatedClass + ')';
      this._previousBrowserColor = document.getElementsByName('theme-color')[0].content;
      document.getElementsByName('theme-color')[0].content = this.getComputedStyleValue('--' + generatedClass);

      if (window.innerWidth < 961) {
        this.$.scrollHeaderPanel.$.headerBg.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.4) -10%, rgba(0, 0, 0, 0.1) 50%), url(' + this.speaker.photoUrl + ') 0 / cover no-repeat';
      }
      this.updateStyles();
    },

    _renderOpened: function _renderOpened() {
      page.redirect('/' + app.route + '/' + this.speaker.id);
      if (this.withBackdrop && window.innerWidth > 960) {
        this.backdropElement.open();
      }
      this.playAnimation('entry');
      this.async(function () {
        this.$.scrollHeaderPanel.scroll(1, true);
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