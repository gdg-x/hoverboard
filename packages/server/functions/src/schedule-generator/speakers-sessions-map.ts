import * as logger from 'firebase-functions/logger';
import { SessionMap, SpeakerMap } from '../utils/firestore.js';
import { combineTags, pickMainTag } from '../utils/tags.js';

export function sessionsSpeakersMap(sessionsRaw: SessionMap, speakersRaw: SpeakerMap) {
  const sessions: Record<string, unknown> = {};
  const speakers: Record<string, unknown> = {};
  const { length } = Object.keys(sessionsRaw);

  for (let index = 0; index < length; index++) {
    const sessionId = Object.keys(sessionsRaw)[index]!;
    const currentSession = sessionsRaw[sessionId]!;
    const sessionSpeakers: unknown[] = [];
    const mainTag = pickMainTag(currentSession.tags);
    const currentSpeakers = currentSession.speakers ?? [];

    currentSpeakers.forEach((speakerId: string) => {
      if (!speakersRaw[speakerId]) {
        logger.log(`Speaker ${speakerId} not found in speakersRaw`);
        return;
      }

      sessionSpeakers.push({ id: speakerId, ...speakersRaw[speakerId] });
      const generatedSpeaker = speakers[speakerId] as
        { tags?: string[]; sessions?: unknown[] } | undefined;
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
