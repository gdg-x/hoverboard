function isDefined(v) {
  return v !== undefined;
}

function getTimeDifference(date, startTime, endTime) {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(date + ' ' + startTime + ' ' + timezone).getTime();
  const timeEnd = new Date(date + ' ' + endTime + ' ' + timezone).getTime();
  return timeEnd - timeStart;
}

function getEndTime(date, startTime, endTime, totalNumber, number) {
  const timezone = new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1];
  const timeStart = new Date(`${date} ${startTime} ${timezone}`).getTime();
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
    mm: Math.floor(difference / 1000 / 60),
  };
}

function addSpeakersToSessions(speakers) {
  return ({ id, session }) => {
    const speakersInThisSession = session
      .speakers
      .map((s) => ({ id: s, s: speakers[s] }))
      .map(({ id, s }) => Object.assign({}, s, { id }))
      .filter(isDefined);

    const sessionWithSpeakers = Object.assign({}, session, { speakers: speakersInThisSession });

    return Object.assign({}, { id, session: sessionWithSpeakers }, {});
  };
}

function hasSpeakersAndSessionsAndSchedule(speakers, sessions, schedule) {
  return hasSpeakersAndSessions(speakers, sessions)
    && schedule != null
    && Object.keys(schedule).length;
}

function hasSpeakersAndSessions(speakers, sessions) {
  return Object.keys(speakers).length && Object.keys(sessions).length;
}


function addTagTo(array, element) {
  if (array.indexOf(element) < 0) {
    return [...array, element];
  }
}

function updateSpeakersSessions(speakersRaw, speakerIds, session) {
  let result = {};
  for (let i = 0; i < speakerIds.length; i++) {
    const speaker = speakersRaw[speakerIds[i]];
    if (speaker) {
      result[speakerIds[i]] = Object.assign({}, speaker, {
        sessions: speaker.sessions
          ? speaker.sessions.map((speakerSession) => speakerSession.id === session.id
            ? session
            : speakerSession)
          : [session],
      });
    }
  }
  return result;
}

self.addEventListener('message', ({ data }) => {
  const speakersRaw = data.speakers;
  const sessionsRaw = data.sessions;
  const scheduleRaw = data.schedule;

  let schedule = {};
  let sessions = {};
  let speakers = {};
  let scheduleTags = [];

  if (hasSpeakersAndSessionsAndSchedule(speakersRaw, sessionsRaw, scheduleRaw)) {
    for (const dayKey of Object.keys(scheduleRaw)) {
      const day = scheduleRaw[dayKey];
      const tracksNumber = day.tracks.length;
      let dayTags = [];
      let timeslots = [];
      let extensions = {};

      const timeslotLen = day.timeslots.length;
      for (let timeslotsIndex = 0; timeslotsIndex < timeslotLen; timeslotsIndex++) {
        const timeslot = day.timeslots[timeslotsIndex];
        let innnerSessions = [];

        const sessionsLen = timeslot.sessions.length;
        for (let sessionIndex = 0; sessionIndex < sessionsLen; sessionIndex++) {
          let subsessions = [];

          const subSessionsLen = timeslot.sessions[sessionIndex].items.length;
          for (let subSessionIndex = 0; subSessionIndex < subSessionsLen; subSessionIndex++) {
            const sessionId = timeslot.sessions[sessionIndex].items[subSessionIndex];
            const subsession = sessionsRaw[sessionId];
            const mainTag = subsession.tags ? subsession.tags[0] : 'General';
            const endTimeRaw = timeslot.sessions[sessionIndex].extend
              ? day.timeslots[timeslotsIndex + timeslot.sessions[sessionIndex].extend - 1].endTime
              : timeslot.endTime;
            const endTime = subSessionsLen > 1
              ? getEndTime(
                dayKey,
                timeslot.startTime,
                endTimeRaw,
                subSessionsLen,
                subSessionIndex + 1
              )
              : endTimeRaw;
            const startTime = subSessionsLen > 1 && subSessionIndex > 0
              ? sessions[timeslot.sessions[sessionIndex].items[subSessionIndex - 1]].endTime
              : timeslot.startTime;

            if (subsession.tags) {
              dayTags = [...new Set([...dayTags, ...subsession.tags])];
            }
            scheduleTags = addTagTo(scheduleTags || [], mainTag);

            const finalSubsession = Object.assign({}, subsession, {
              mainTag,
              id: sessionId.toString(),
              day: dayKey,
              track: subsession.track || day.tracks[sessionIndex],
              startTime,
              endTime,
              duration: getDuration(dayKey, startTime, endTime),
              dateReadable: day.dateReadable,
              speakers: subsession.speakers ? subsession.speakers.map((speakerId) => Object.assign({
                id: speakerId,
              }, speakersRaw[speakerId], {
                sessions: null,
              })) : [],
            });

            subsessions.push(finalSubsession);
            sessions[sessionId] = finalSubsession;
            if (subsession.speakers) {
              speakers = Object.assign(
                {},
                speakers,
                updateSpeakersSessions(speakersRaw, subsession.speakers, finalSubsession)
              );
            }
          }

          const start = `${timeslotsIndex + 1} / ${sessionIndex + 1}`;
          const end = `${timeslotsIndex +
          (timeslot.sessions[sessionIndex].extend || 0) + 1} / ${sessionsLen !== 1
            ? sessionIndex + 2 : Object.keys(extensions).length ? Object.keys(extensions)[0]
              : tracksNumber + 1}`;

          if (timeslot.sessions[sessionIndex].extend) {
            extensions[sessionIndex + 1] = timeslot.sessions[sessionIndex].extend;
          }

          innnerSessions = [...innnerSessions, {
            gridArea: `${start} / ${end}`,
            items: subsessions,
          }];
        }

        for (const [key, value] of Object.entries(extensions)) {
          if (value === 1) {
            delete extensions[key];
          } else {
            extensions[key] = value - 1;
          }
        }

        timeslots.push(Object.assign({}, timeslot, {
          sessions: innnerSessions,
        }));
      }

      schedule = Object.assign({}, schedule, {
        days: Object.assign({}, schedule.days, {
          [dayKey]: Object.assign({}, day, {
            timeslots,
            tags: dayTags,
          }),
        }),
      });
    }
  } else if (hasSpeakersAndSessions(speakersRaw, sessionsRaw)) {
    const withSpeakers = addSpeakersToSessions(speakersRaw);

    sessions = Object.keys(sessionsRaw)
      .map((sessionId) => ({ id: sessionId, session: sessionsRaw[sessionId] }))
      .map(withSpeakers)
      .reduce((prev, curr) => Object.assign({}, { [curr.id]: curr.session }, prev), {})
    ;

    speakers = speakersRaw;
  }

  self.postMessage({
    speakers,
    schedule,
    sessions,
  });
}, false);
