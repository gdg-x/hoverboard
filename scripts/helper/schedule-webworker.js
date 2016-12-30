function getSession(session, day, dayIndex, schedule, speakersRaw) {
  session.mainTag = session.tags ? session.tags[0] : 'General';
  session.day = dayIndex + 1;

  if (day.tags.indexOf(session.mainTag) < 0) {
    day.tags.push(session.mainTag);
  }
  if (schedule.tags.indexOf(session.mainTag) < 0) {
    schedule.tags.push(session.mainTag);
  }
  var speakers = [];
  if (session.speakers) {
    for (var j = 0, speakersLen = session.speakers.length; j < speakersLen; j++) {
      if (!session.speakers[j].id) {
        session.speakers[j] = speakersRaw[session.speakers[j]];
        var tempSession = JSON.parse(JSON.stringify(session));
        delete tempSession.speakers;
        if (session.speakers[j]) {
          if (!session.speakers[j].sessions) {
            session.speakers[j].sessions = [];
          }
          session.speakers[j].sessions.push(tempSession);
          speakers.push(session.speakers[j].name);
        }
      }
    }
  }
  return session;
}

function getEndTime(date, startTime, endTime, totalNumber, number) {
  var timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1],
    timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime(),
    timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime(),
    difference = Math.floor((timeEnd - timeStart) / totalNumber),
    result = new Date(timeStart + difference * number);
  return result.getHours() + ':' + result.getMinutes();
}

self.addEventListener('message', function (e) {
  var speakers = e.data.speakers;
  var sessions = e.data.sessions;
  var schedule = e.data.schedule;

  schedule.tags = [];
  for (var i = 0, scheduleLen = schedule.length; i < scheduleLen; i++) {
    var day = schedule[i];
    schedule[i].tags = [];
    for (var j = 0, timeslotsLen = day.timeslots.length; j < timeslotsLen; j++) {
      var timeslot = day.timeslots[j];
      for (var k = 0, sessionsLen = timeslot.sessions.length; k < sessionsLen; k++) {
        for (var l = 0, subSessionsLen = timeslot.sessions[k].length; l < subSessionsLen; l++) {
          var session = getSession(sessions[timeslot.sessions[k][l]], day, i, schedule, speakers);
          if (session && !session.track) {
            session.track = day.tracks[k];
          }
          session.startTime = timeslot.startTime;
          session.endTime = subSessionsLen > 1 ? getEndTime(day.date, timeslot.startTime, timeslot.endTime, subSessionsLen, l + 1) : timeslot.endTime;
          session.dateReadable = day.dateReadable;
          schedule[i].timeslots[j].sessions[k][l] = session;
        }
      }
    }
  }

  self.postMessage({
    speakers: speakers,
    sessions: sessions,
    schedule: schedule
  });
}, false);
