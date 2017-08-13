function getTimeDifference(date, startTime, endTime) {
  const timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
  const timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime();
  const timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime();
 return timeEnd - timeStart;
}

function getEndTime(date, startTime, endTime, totalNumber, number) {
  const timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
  const timeStart = new Date(`${date} ${startTime } ${timezone}`).getTime();
  const difference = Math.floor(getTimeDifference(date, startTime, endTime) / totalNumber);
  const result = new Date(timeStart + difference * number);
  return result.getHours() + ':' + result.getMinutes();
}

function getDuration(date, startTime, endTime) {
  let difference = getTimeDifference(date, startTime, endTime);
  const hh = Math.floor(difference / 1000 / 60 / 60);
  difference -= hh * 1000 * 60 * 60;
  return {
    hh,
    mm: Math.floor(difference / 1000 / 60)
  }
}

function addTagTo(array, element) {
  if (array.indexOf(element) < 0) {
    return [...array, element];
  }
}

self.addEventListener('message', ({ data }) => {
  const speakers = data.speakers;
  const sessionsRaw = data.sessions;
  const scheduleRaw = data.schedule;

  let schedule = {};
  let sessions = {};
  let scheduleTags = [];

  for (const dayKey of Object.keys(scheduleRaw)) {
    const day = scheduleRaw[dayKey];
    const tracksNumber = day.tracks.length;
    let dayTags = [];
    let timeslots = [];

    for (let timeslotsIndex = 0, timeslotLen = day.timeslots.length; timeslotsIndex < timeslotLen; timeslotsIndex++) {
      const timeslot = day.timeslots[timeslotsIndex];
      let innnerSessions = [];

      for (let sessionIndex = 0, sessionsLen = timeslot.sessions.length; sessionIndex < sessionsLen; sessionIndex++) {
        let subsessions = [];

        for (let subSessionIndex = 0, subSessionsLen = timeslot.sessions[sessionIndex].items.length; subSessionIndex < subSessionsLen; subSessionIndex++) {
          const sessionId = timeslot.sessions[sessionIndex].items[subSessionIndex];
          const subsession = sessionsRaw[sessionId];
          const mainTag = subsession.tags ? subsession.tags[0] : 'General';
          const endTimeRaw = timeslot.sessions[sessionIndex].extend
            ? day.timeslots[timeslotsIndex + timeslot.sessions[sessionIndex].extend - 1].endTime
            : timeslot.endTime;
          const endTime = subSessionsLen > 1
            ? getEndTime(dayKey, timeslot.startTime, endTimeRaw, subSessionsLen, subSessionIndex + 1)
            : endTimeRaw;
          const startTime = subSessionsLen > 1 && subSessionIndex > 0
            ? sessions[timeslot.sessions[sessionIndex].items[subSessionIndex - 1]].endTime
            : timeslot.startTime;

          if (subsession.tags) {
            dayTags = [...new Set([...dayTags, ...subsession.tags])];
          }
          scheduleTags = addTagTo((scheduleTags || []), mainTag);

          const finalSubsession = {
            ...subsession,
            mainTag,
            id: sessionId,
            day: dayKey,
            track: subsession.track || day.tracks[sessionIndex],
            startTime,
            endTime,
            duration: getDuration(dayKey, startTime, endTime),
            dateReadable: day.dateReadable,
            speakers: subsession.speakers ? subsession.speakers.map(speakerId => speakers[speakerId]) : []
          };

          subsessions.push(finalSubsession);
          sessions = {
            ...sessions,
            [sessionId]: finalSubsession
          }
        }

        const start = `${timeslotsIndex + 1 } / ${sessionIndex + 1}`;
        const end = `${timeslotsIndex + (timeslot.sessions[sessionIndex].extend || 0) + 1 } / ${sessionsLen !== 1 ? sessionIndex + 2 : tracksNumber + 1}`;

        innnerSessions = [...innnerSessions, {
          gridArea: `${start} / ${end}`,
          items: subsessions
        }];
      }

      timeslots.push({
        ...timeslot,
        sessions: innnerSessions
      })
    }

    schedule = {
      ...schedule,
      days: {
        ...schedule.days,
        [dayKey]: {
          ...day,
          timeslots,
          tags: dayTags
        }
      }
    }
  }

  self.postMessage({
    schedule,
    sessions
  });
}, false);
