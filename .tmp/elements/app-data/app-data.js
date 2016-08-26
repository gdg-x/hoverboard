'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var AppData = function () {
    function AppData() {
      _classCallCheck(this, AppData);
    }

    _createClass(AppData, [{
      key: 'beforeRegister',
      value: function beforeRegister() {
        this.is = this.constructor.name.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        this.properties = {
          speakersSource: {
            type: String,
            value: '/data/speakers.json'
          },
          sessionsSource: {
            type: String,
            value: '/data/sessions.json'
          },
          postsSource: {
            type: String,
            value: '/data/blog.json'
          },
          partnersSource: {
            type: String,
            value: '/data/partners.json'
          },
          scheduleSource: {
            type: String,
            value: '/data/schedule.json'
          },
          speakers: {
            type: Array,
            notify: true
          },
          sessions: {
            type: Object,
            notify: true
          },
          posts: {
            type: Array,
            notify: true
          },
          partners: {
            type: Array,
            notify: true
          },
          schedule: {
            type: Array,
            notify: true
          },
          videos: {
            type: Array,
            notify: true
          },
          _speakersRaw: Object,
          _scheduleRaw: Array,
          _tempVideos: {
            type: Array,
            value: []
          }
        };
        this.observers = ['_generateSchedule(_speakersRaw, sessions, _scheduleRaw)'];
      }
    }, {
      key: '_generateSchedule',
      value: function _generateSchedule() {
        for (var i = 0, scheduleLen = this._scheduleRaw.length; i < scheduleLen; i++) {
          var day = this._scheduleRaw[i];
          this._scheduleRaw[i].tags = [];
          for (var j = 0, timeslotsLen = day.timeslots.length; j < timeslotsLen; j++) {
            var timeslot = day.timeslots[j];
            for (var k = 0, sessionsLen = timeslot.sessions.length; k < sessionsLen; k++) {
              for (var l = 0, subSessionsLen = timeslot.sessions[k].length; l < subSessionsLen; l++) {
                var session = this._getSession(timeslot.sessions[k][l], day);
                if (session && !session.track) {
                  session.track = day.tracks[k];
                }
                session.startTime = timeslot.startTime;
                session.endTime = subSessionsLen > 1 ? this._getEndTime(day.date, timeslot.startTime, timeslot.endTime, subSessionsLen, l + 1) : timeslot.endTime;
                session.dateReadable = day.dateReadable;
                this._scheduleRaw[i].timeslots[j].sessions[k][l] = session;
              }
            }
          }
        }
        this.schedule = this._scheduleRaw;
        this.speakers = this._speakersRaw;
        this.videos = this._tempVideos;
      }
    }, {
      key: '_getSession',
      value: function _getSession(sessionId, day) {
        var session = this.sessions[sessionId];
        session.mainTag = session.tags ? session.tags[0] : 'General';

        if (day.tags.indexOf(session.mainTag) < 0) {
          day.tags.push(session.mainTag);
        }
        var speakers = [];
        if (session.speakers) {
          for (var j = 0, speakersLen = session.speakers.length; j < speakersLen; j++) {
            if (!session.speakers[j].id) {
              session.speakers[j] = this._speakersRaw[session.speakers[j]];
              var tempSession = JSON.parse(JSON.stringify(session));
              delete tempSession.speakers;
              if (!session.speakers[j].sessions) {
                session.speakers[j].sessions = [];
              }
              session.speakers[j].sessions.push(tempSession);
              speakers.push(session.speakers[j].name);
            }
          }
        }
        if (session.videoId) {
          this.push('_tempVideos', {
            youtubeId: session.videoId,
            title: session.title,
            speakers: speakers.join(', '),
            thumbnail: session.thumbnail
          });
        }
        return session;
      }
    }, {
      key: '_getEndTime',
      value: function _getEndTime(date, startTime, endTime, totalNumber, number) {
        var timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1],
            timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime(),
            timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime(),
            difference = Math.floor((timeEnd - timeStart) / totalNumber),
            result = new Date(timeStart + difference * number);
        return result.getHours() + ':' + result.getMinutes();
      }
    }, {
      key: '_reversePosts',
      value: function _reversePosts(response) {
        this.posts = response.detail.response.reverse();
      }
    }]);

    return AppData;
  }();

  Polymer(AppData);
})();