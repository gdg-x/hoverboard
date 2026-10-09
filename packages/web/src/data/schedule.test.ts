import { describe, expect, it } from 'vitest';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { buildContentSchedule, sessionContent, speakerContent } from './schedule';

const speaker = (id: string) => ({ id, name: id }) as Speaker;
const session = (id: string, speakers: string[]): Session => ({
  id,
  title: id,
  description: '',
  speakers,
});

const content = {
  sessions: [session('a', ['ada', 'grace']), session('b', ['alan']), session('c', ['ada'])],
  speakers: [speaker('ada'), speaker('grace'), speaker('alan')],
};

const ids = ({ sessions, speakers }: ReturnType<typeof sessionContent>) => ({
  sessions: sessions.map(({ id }) => id),
  speakers: speakers.map(({ id }) => id),
});

describe('sessionContent', () => {
  it('has the session and its speakers', () => {
    expect(ids(sessionContent(content, 'a'))).toEqual({
      sessions: ['a'],
      speakers: ['ada', 'grace'],
    });
  });
});

describe('speakerContent', () => {
  it("has the speaker, their sessions and those sessions' speakers", () => {
    expect(ids(speakerContent(content, 'ada'))).toEqual({
      sessions: ['a', 'c'],
      speakers: ['ada', 'grace'],
    });
  });

  it('has the speaker without sessions', () => {
    expect(ids(speakerContent({ ...content, sessions: [] }, 'alan'))).toEqual({
      sessions: [],
      speakers: ['alan'],
    });
  });
});

describe('buildContentSchedule', () => {
  it('builds from the content, or from nothing', () => {
    expect(buildContentSchedule(content).sessions.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
    expect(buildContentSchedule({})).toEqual({ schedule: [], sessions: [], speakers: [] });
  });
});
