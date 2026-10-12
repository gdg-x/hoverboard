import { describe, expect, it } from 'vitest';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import type { Content } from '../store/content';
import { contentPresence } from './presence';

const session = (scheduled: boolean): Session => ({
  id: 'a',
  title: 'A',
  description: '',
  speakers: [],
  ...(scheduled && {
    day: '2017-10-13',
    startTime: '10:00',
    endTime: '11:00',
    track: 'expo-hall',
  }),
});

describe('contentPresence', () => {
  it('says which features have content, and leaves out features that are off', () => {
    const content = {
      blog: [{}],
      gallery: [],
      members: [{}],
      partners: [],
      speakers: [{ id: 'ada', name: 'Ada' } as Speaker],
      tickets: [],
    } as unknown as Partial<Content>;

    expect(contentPresence(content)).toEqual({
      blog: true,
      gallery: false,
      partners: false,
      speakers: true,
      team: true,
      tickets: false,
    });
  });

  it('has a schedule only when it has days', () => {
    expect(contentPresence({ sessions: [session(true)], speakers: [] })).toMatchObject({
      schedule: true,
    });
    expect(contentPresence({ sessions: [session(false)], speakers: [] })).toMatchObject({
      schedule: false,
    });
    expect(contentPresence({ sessions: [], speakers: [] })).toMatchObject({ schedule: false });
  });
});
