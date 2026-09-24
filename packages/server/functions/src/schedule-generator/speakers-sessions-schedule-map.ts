import { SessionMap, SpeakerMap } from '../utils/firestore.js';
import {
  calculateEndTime,
  calculateStartTime,
  collectSpeakers,
  getDuration,
  RawScheduleDay,
} from '../utils/schedule-time.js';
import { combineTags, pickMainTag } from '../utils/tags.js';

export function sessionsSpeakersScheduleMap(
  sessionsRaw: SessionMap,
  speakersRaw: SpeakerMap,
  scheduleRaw: Record<string, RawScheduleDay>,
) {
  const sessions: Record<string, unknown> = {};
  let schedule: Record<string, unknown> = {};
  let scheduleTags: string[] = [];
  let speakers: Record<string, unknown> = {};

  for (const dayKey of Object.keys(scheduleRaw)) {
    const day = scheduleRaw[dayKey]!;
    const tracksNumber = day.tracks?.length || 0;
    let dayTags: string[] = [];
    const timeslots: unknown[] = [];
    const extensions: { [key: string]: number } = {};

    const timeslotLen = day.timeslots?.length || 0;
    for (let timeslotsIndex = 0; timeslotsIndex < timeslotLen; timeslotsIndex++) {
      const timeslot = day.timeslots[timeslotsIndex]!;
      let innerSessions: unknown[] = [];

      const sessionsLen = timeslot.sessions?.length || 0;
      for (let sessionIndex = 0; sessionIndex < sessionsLen; sessionIndex++) {
        const subSessions: unknown[] = [];

        const sessionBlock = timeslot.sessions?.[sessionIndex];
        const subSessionsLen = sessionBlock?.items?.length || 0;
        for (let subSessionIndex = 0; subSessionIndex < subSessionsLen; subSessionIndex++) {
          const sessionId = sessionBlock?.items?.[subSessionIndex];
          if (!sessionId) continue;
          const subsession = sessionsRaw[sessionId];
          const mainTag = pickMainTag(subsession?.tags);
          const endTime = calculateEndTime(
            subSessionsLen,
            timeslot,
            sessionIndex,
            day,
            timeslotsIndex,
            dayKey,
            subSessionIndex,
          );
          const startTime = calculateStartTime(
            subSessionsLen,
            subSessionIndex,
            sessionIndex,
            sessions as Record<string, { endTime: string }>,
            timeslot,
          );

          dayTags = combineTags(dayTags, subsession?.tags);
          scheduleTags = combineTags(scheduleTags, mainTag ? [mainTag] : []);

          const finalSubSession = {
            ...subsession,
            mainTag,
            id: sessionId,
            day: dayKey,
            track: subsession?.track || day.tracks?.[sessionIndex],
            startTime,
            endTime,
            duration: getDuration(dayKey, startTime, endTime),
            dateReadable: day.dateReadable,
            speakers: collectSpeakers(subsession?.speakers || [], speakersRaw),
          };

          subSessions.push(finalSubSession);
          sessions[sessionId] = finalSubSession;
          if (subsession?.speakers) {
            speakers = {
              ...speakers,
              ...updateSpeakersSessions(
                speakersRaw,
                subsession.speakers,
                finalSubSession,
                speakers,
              ),
            };
          }
        }

        const displayStart = timeslotsIndex + (sessionBlock?.extend || 0) + 1;
        const displayEnd =
          sessionsLen !== 1
            ? sessionIndex + 2
            : Object.keys(extensions).length
              ? Object.keys(extensions)[0]
              : tracksNumber + 1;
        const start = `${timeslotsIndex + 1} / ${sessionIndex + 1}`;
        const end = `${displayStart} / ${displayEnd}`;

        if (sessionBlock?.extend) {
          extensions[sessionIndex + 1] = sessionBlock.extend;
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

function updateSpeakersSessions(
  speakersRaw: SpeakerMap,
  speakerIds: string[],
  session: { id: string; tags?: string[] },
  generatedSpeakers: Record<string, any>,
) {
  const result: Record<string, unknown> = {};
  for (let i = 0; i < speakerIds.length; i++) {
    const speakerId = speakerIds[i]!;
    const speaker = speakersRaw[speakerId];
    const generatedSpeaker = generatedSpeakers[speakerId];
    const hasSessionsAssigned = generatedSpeaker?.sessions?.length;

    if (speaker) {
      const speakerSessions = hasSessionsAssigned ? [...generatedSpeaker.sessions] : [];

      if (
        !speakerSessions.filter(
          (speakerSession: { id: string }) => speakerSession.id === session.id,
        ).length
      ) {
        speakerSessions.push(session);
      }

      let speakerTags: string[] = hasSessionsAssigned ? [...generatedSpeaker.tags] : [];
      speakerSessions.forEach((sessionItem: { tags?: string[] }) => {
        speakerTags = combineTags(speakerTags, sessionItem.tags);
      });

      result[speakerId] = Object.assign({}, speaker, {
        id: speakerId,
        sessions: speakerSessions,
        tags: speakerTags,
      });
    }
  }
  return result;
}
