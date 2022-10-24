import {
  calculateEndTime,
  calculateStartTime,
  collectSpeakers,
  combineTags,
  getDuration,
  pickMainTag,
} from '../utils.js';

export function sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw) {
  const sessions = {};
  let schedule = {};
  let scheduleTags = [];
  let speakers = {};

  for (const dayKey of Object.keys(scheduleRaw)) {
    const day = scheduleRaw[dayKey];
    const tracksNumber = day.tracks.length;
    let dayTags = [];
    const timeslots = [];
    const extensions: { [key: string]: number } = {};

    const timeslotLen = day.timeslots.length;
    for (let timeslotsIndex = 0; timeslotsIndex < timeslotLen; timeslotsIndex++) {
      const timeslot = day.timeslots[timeslotsIndex];
      let innerSessions = [];

      const sessionsLen = timeslot.sessions.length;
      for (let sessionIndex = 0; sessionIndex < sessionsLen; sessionIndex++) {
        const subSessions = [];

        const subSessionsLen = timeslot.sessions[sessionIndex].items.length;
        for (let subSessionIndex = 0; subSessionIndex < subSessionsLen; subSessionIndex++) {
          const sessionId = timeslot.sessions[sessionIndex].items[subSessionIndex];
          const subsession = sessionsRaw[sessionId];
          const mainTag = pickMainTag(subsession?.tags);
          const endTime = calculateEndTime(
            subSessionsLen,
            timeslot,
            sessionIndex,
            day,
            timeslotsIndex,
            dayKey,
            subSessionIndex
          );
          const startTime = calculateStartTime(
            subSessionsLen,
            subSessionIndex,
            sessionIndex,
            sessions,
            timeslot
          );

          dayTags = combineTags(dayTags, subsession?.tags);
          scheduleTags = combineTags(scheduleTags, [mainTag]);

          const finalSubSession = {
            ...subsession,
            mainTag,
            id: sessionId,
            day: dayKey,
            track: subsession.track || day.tracks[sessionIndex],
            startTime,
            endTime,
            duration: getDuration(dayKey, startTime, endTime),
            dateReadable: day.dateReadable,
            speakers: collectSpeakers(subsession.speakers, speakersRaw),
          };

          subSessions.push(finalSubSession);
          sessions[sessionId] = finalSubSession;
          if (subsession.speakers) {
            speakers = {
              ...speakers,
              ...updateSpeakersSessions(
                speakersRaw,
                subsession.speakers,
                finalSubSession,
                speakers
              ),
            };
          }
        }

        const displayStart = timeslotsIndex + (timeslot.sessions[sessionIndex].extend || 0) + 1;
        const displayEnd =
          sessionsLen !== 1
            ? sessionIndex + 2
            : Object.keys(extensions).length
            ? Object.keys(extensions)[0]
            : tracksNumber + 1;
        const start = `${timeslotsIndex + 1} / ${sessionIndex + 1}`;
        const end = `${displayStart} / ${displayEnd}`;

        if (timeslot.sessions[sessionIndex].extend) {
          extensions[sessionIndex + 1] = timeslot.sessions[sessionIndex].extend;
        }

        innerSessions = [
          ...innerSessions,
          {
            gridArea: `${start} / ${end}`,
            items: subSessions,
          },
        ];
      }

      for (const [key, value] of Object.entries(extensions)) {
        if (value === 1) {
          delete extensions[key];
        } else {
          extensions[key] = value - 1;
        }
      }

      timeslots.push({
        ...timeslot,
        sessions: innerSessions,
      });
    }

    schedule = {
      ...schedule,
      [dayKey]: {
        ...day,
        timeslots,
        tags: dayTags,
      },
    };
  }

  return {
    sessions,
    schedule,
    speakers,
  };
}

function updateSpeakersSessions(speakersRaw, speakerIds, session, generatedSpeakers) {
  const result = {};
  for (let i = 0; i < speakerIds.length; i++) {
    const speaker = speakersRaw[speakerIds[i]];
    const generatedSpeaker = generatedSpeakers[speakerIds[i]];
    const hasSessionsAssigned = generatedSpeaker?.sessions?.length;

    if (speaker) {
      const speakerSessions = hasSessionsAssigned ? [...generatedSpeaker.sessions] : [];

      if (!speakerSessions.filter((speakerSession) => speakerSession.id === session.id).length) {
        speakerSessions.push(session);
      }

      let speakerTags = hasSessionsAssigned ? [...generatedSpeaker.tags] : [];
      speakerSessions.forEach((session) => {
        speakerTags = combineTags(speakerTags, session.tags);
      });

      result[speakerIds[i]] = Object.assign({}, speaker, {
        id: speakerIds[i],
        sessions: speakerSessions,
        tags: speakerTags,
      });
    }
  }
  return result;
}
