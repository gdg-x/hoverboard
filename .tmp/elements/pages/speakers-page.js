'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'speakers-page',

    behaviors: [Polymer.NeonSharedElementAnimatableBehavior, Polymer.UtilsBehavior],

    properties: {
      speakers: {
        type: Object
      },
      selected: {
        type: Boolean,
        observer: 'updateHeroSettings'
      },
      heroSettings: {
        type: Object,
        notify: true
      },
      speakerId: {
        type: String,
        notify: true
      },
      _selectedSpeaker: Object,
      _heroSettings: {
        type: Object,
        /* jshint ignore:start */
        value: function value() {
          return { "backgroundColor": "#673AB7", "fontColor": "#FFFFFF", "tabBarColor": "#FFFFFF" };
        }
        /* jshint ignore:end */
      },

      animationConfig: {
        type: Object,
        value: function value() {
          return {
            'entry': [{
              name: 'fade-in-animation',
              animation: 'fade-in-animation',
              node: this,
              timing: {
                delay: 500
              }
            }],
            'exit': [{
              name: 'fade-out-animation',
              animation: 'fade-out-animation',
              node: this
            }]
          };
        }
      }
    },

    observers: ['openSpeakerDetails(selected, speakerId, speakers)'],

    updateHeroSettings: function updateHeroSettings() {
      this.heroSettings = this.selected ? this._heroSettings : this.heroSettings;
    },

    openSpeakerDetails: function openSpeakerDetails() {
      if (this.selected && this.speakerId) {
        this.async(function () {
          this._selectedSpeaker = this.speakers[this.speakerId];
          this.$.speakerDetails.open();
          this.speakerId = null;
        }, 500);
      }
    },

    _updateCascadedNodes: function _updateCascadedNodes() {
      var cascaded = Polymer.dom(this.root).querySelectorAll('[cascaded]');
      var cascadedArray = Array.prototype.slice.call(cascaded);
      this.animationConfig.entry.push({
        name: 'cascaded-animation',
        animation: 'transform-animation',
        transformFrom: 'translate3d(0, 100%, 0)',
        timing: {
          delay: 500
        },
        nodes: cascadedArray
      });
      this.animationConfig.exit.push({
        name: 'cascaded-animation',
        animation: 'transform-animation',
        transformTo: 'translate3d(0, 100%, 0)',
        nodes: cascadedArray
      });
    },

    _openSpeaker: function _openSpeaker(e) {
      this._selectedSpeaker = e.model.speaker;
      this.$.speakerDetails.open();
    }

  });
})();