'use strict';

(function () {
  'use strict';

  Polymer({

    is: 'schedule-page',

    behaviors: [Polymer.NeonSharedElementAnimatableBehavior, Polymer.UtilsBehavior],

    properties: {
      schedule: {
        type: Array,
        observer: '_updateLegend'
      },
      sessions: Object,
      selected: {
        type: Boolean,
        observer: 'updateHeroSettings'
      },
      heroSettings: {
        type: Object,
        notify: true
      },
      sessionId: {
        type: String,
        notify: true
      },
      _entryAnimation: String,
      _exitAnimation: String,
      _selectedDay: {
        type: Number,
        value: 0,
        observer: '_changeDay'
      },
      _heroSettings: {
        type: Object,
        /* jshint ignore:start */
        value: function value() {
          return { "backgroundColor": "#607D8B", "fontColor": "#FFFFFF", "tabBarColor": "#FFFFFF" };
        }
        /* jshint ignore:end */
      },
      _selectedTags: {
        type: Array,
        value: []
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

    observers: ['openSessionDetails(selected, sessionId, sessions)'],

    ready: function ready() {
      this.customStyle['--hero-color'] = this._heroSettings.backgroundColor;
      this.updateStyles();
    },

    updateHeroSettings: function updateHeroSettings() {
      this.heroSettings = this.selected ? this._heroSettings : this.heroSettings;
    },

    openSessionDetails: function openSessionDetails() {
      if (this.selected && this.sessionId) {
        this.async(function () {
          this._selectedSession = this.sessions[this.sessionId];
          this.$.sessionDetails.open();
          this.sessionId = null;
        }, 500);
      }
    },

    _updateLegend: function _updateLegend() {
      this._selectedTags = this.schedule[0].tags;
    },

    _changeDay: function _changeDay(newValue, oldValue) {
      if (window.innerWidth < 961) {
        this._entryAnimation = newValue < oldValue ? 'slide-from-right-animation' : 'slide-from-left-animation';
        this._exitAnimation = newValue < oldValue ? 'slide-left-animation' : 'slide-right-animation';
      } else {
        this._entryAnimation = 'fade-in-animation';
        this._exitAnimation = 'fade-out-animation';
      }
      if (this.schedule) {
        this._selectedTags = this.schedule[newValue].tags;
      }
    },

    _getCustomStyleValue: function _getCustomStyleValue(value) {
      return this.getComputedStyleValue('--' + this._generateClass(value));
    },

    _openSession: function _openSession(e) {
      this._selectedSession = e.model.subSession;
      this.$.sessionDetails.open();
    },

    _getFirstCharacters: function _getFirstCharacters(text) {
      return text ? text.substring(0, 2) : '';
    },

    _filterSession: function _filterSession() {
      var tags = this._selectedTags || [];
      return function (session) {
        return tags.indexOf(session.mainTag) > -1;
      };
    }

  });
})();