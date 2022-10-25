import * as functions from 'firebase-functions';
import { combineTags, pickMainTag, SessionMap, SpeakerMap } from '../utils.js';

export function sessionsSpeakersMap(sessionsRaw: SessionMap, speakersRaw: SpeakerMap) {
  const sessions = {};
  const speakers = {};
  const { length } = Object.keys(sessionsRaw);

  for (let index = 0; index < length; index++) {
    const sessionId = Object.keys(sessionsRaw)[index];
    const currentSession = sessionsRaw[sessionId];
    const sessionSpeakers = [];
    const mainTag = pickMainTag(currentSession.tags);
    const currentSpeakers = currentSession.speakers ?? [];

    currentSpeakers.forEach((speakerId: string) => {
      if (!speakersRaw[speakerId]) {
        functions.logger.log(`Speaker ${speakerId} not found in speakersRaw`);
        return;
      }

      sessionSpeakers.push({ id: speakerId, ...speakersRaw[speakerId] });
      const generatedSpeaker = speakers[speakerId];
      const sessionBySpeaker = {
        id: sessionId,
        mainTag,
        ...currentSession,
      };

      if (generatedSpeaker) {
        const speakerTags = combineTags(generatedSpeaker.tags, sessionBySpeaker.tags);
        const speakerSessions = generatedSpeaker.sessions
          ? [...generatedSpeaker.sessions, sessionBySpeaker]
          : [sessionBySpeaker];

        speakers[speakerId] = {
          ...generatedSpeaker,
          tags: [...speakerTags],
          sessions: speakerSessions,
        };
      } else {
        speakers[speakerId] = {
          ...speakersRaw[speakerId],
          id: speakerId,
          tags: sessionBySpeaker.tags,
          sessions: [sessionBySpeaker],
        };
      }
    });

    sessions[sessionId] = {
      ...currentSession,
      id: sessionId,
      mainTag: mainTag,
      speakers: sessionSpeakers,
    };
  }

  return { sessions, speakers };
}
