'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'video-dialog',

    behaviors: [Polymer.PaperDialogBehavior, Polymer.NeonAnimationRunnerBehavior],

    properties: {
      title: String,
      youtubeId: String,
      disableControls: {
        type: Boolean,
        value: false
      }
    },

    listeners: {
      'neon-animation-finish': '_onNeonAnimationFinish'
    },

    _renderOpened: function _renderOpened() {
      if (this.withBackdrop) {
        this.backdropElement.open();
      }
      this.playAnimation('entry');
      this.$.video.play();
    },

    _renderClosed: function _renderClosed() {
      this.$.video.seekTo(0);
      this.$.video.pause();
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