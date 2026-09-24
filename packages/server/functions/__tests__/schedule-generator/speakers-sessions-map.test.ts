import { describe, expect, it } from 'vitest';
import { sessionsSpeakersMap as sessionsSpeakersMapUntyped } from '../../src/schedule-generator/speakers-sessions-map';

type AnyRecord = Record<string, any>;
const sessionsSpeakersMap = sessionsSpeakersMapUntyped as (
  sessionsRaw: AnyRecord,
  speakersRaw: AnyRecord,
) => { sessions: AnyRecord; speakers: AnyRecord };

describe('sessionsSpeakersMap', () => {
  it('attaches speakers to sessions and sessions to speakers', () => {
    const sessionsRaw = {
      s1: { title: 'Talk one', tags: ['web'], speakers: ['ada'] },
    };
    const speakersRaw = {
      ada: { name: 'Ada Lovelace' },
    };

    const { sessions, speakers } = sessionsSpeakersMap(sessionsRaw, speakersRaw);

    expect(sessions.s1).toStrictEqual({
      title: 'Talk one',
      tags: ['web'],
      id: 's1',
      mainTag: 'web',
      speakers: [{ id: 'ada', name: 'Ada Lovelace' }],
    });
    expect(speakers.ada).toStrictEqual({
      name: 'Ada Lovelace',
      id: 'ada',
      tags: ['web'],
      sessions: [{ id: 's1', mainTag: 'web', title: 'Talk one', tags: ['web'], speakers: ['ada'] }],
    });
  });

  it('accumulates multiple sessions and combined tags for a shared speaker', () => {
    const sessionsRaw = {
      s1: { title: 'Talk one', tags: ['web'], speakers: ['ada'] },
      s2: { title: 'Talk two', tags: ['a11y'], speakers: ['ada'] },
    };
    const speakersRaw = { ada: { name: 'Ada Lovelace' } };

    const { speakers } = sessionsSpeakersMap(sessionsRaw, speakersRaw);

    expect(speakers.ada.tags).toStrictEqual(['web', 'a11y']);
    expect(speakers.ada.sessions).toHaveLength(2);
  });

  it('defaults a session with no speakers to an empty speakers array', () => {
    const sessionsRaw = { s1: { title: 'Talk one' } };

    const { sessions, speakers } = sessionsSpeakersMap(sessionsRaw, {});

    expect(sessions.s1.speakers).toStrictEqual([]);
    expect(speakers).toStrictEqual({});
  });

  it('skips speaker ids that are not found in speakersRaw', () => {
    const sessionsRaw = { s1: { title: 'Talk one', speakers: ['missing'] } };

    const { sessions, speakers } = sessionsSpeakersMap(sessionsRaw, {});

    expect(sessions.s1.speakers).toStrictEqual([]);
    expect(speakers).toStrictEqual({});
  });

  it('defaults the main tag to "General" when a session has no tags', () => {
    const sessionsRaw = { s1: { title: 'Talk one' } };

    const { sessions } = sessionsSpeakersMap(sessionsRaw, {});

    expect(sessions.s1.mainTag).toBe('General');
  });
});
