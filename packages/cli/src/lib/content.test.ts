import { describe, expect, it } from 'vitest';
import seed from '../../../../docs/default-firebase-data.json';
import { siteTracks, validateContent, validateSchedule, validateSeedData } from './content.js';

const session = { title: 'Keynote', description: 'Opening talk' };

describe('validateSeedData', () => {
  it('accepts docs/default-firebase-data.json', () => {
    expect(() => validateSeedData(seed)).not.toThrow();
  });

  it('rejects unknown top-level collections', () => {
    expect(() => validateSeedData({ ...seed, triggers: {} })).toThrow(
      'docs/default-firebase-data.json: unknown field "triggers"',
    );
  });
});

describe('validateContent', () => {
  it('accepts a valid document', () => {
    expect(() => validateContent('sessions', '101', session)).not.toThrow();
  });

  it('accepts import fields on sessions and speakers', () => {
    expect(() =>
      validateContent('sessions', '101', { ...session, source: 'sessionize', externalId: '42' }),
    ).not.toThrow();
  });

  it("accepts a session's day, times and track, all together or none", () => {
    const time = { day: '2027-10-15', startTime: '09:00', endTime: '09:40' };
    expect(() => validateContent('sessions', '101', { ...session, ...time })).not.toThrow();
    expect(() =>
      validateContent('sessions', '101', { ...session, ...time, track: 'main-hall' }),
    ).not.toThrow();
    expect(() => validateContent('sessions', '101', { ...session, day: '2027-10-15' })).toThrow(
      'sessions/101: "day" needs "startTime" too.\nsessions/101: "day" needs "endTime" too.',
    );
    expect(() =>
      validateContent('sessions', '101', { ...session, ...time, startTime: '9:00' }),
    ).toThrow('sessions/101: startTime "9:00" must be a time, HH:MM.');
  });

  it('names the document, the field and the problem when a document is invalid', () => {
    expect(() => validateContent('sessions', '101', { title: 'Keynote' })).toThrow(
      'sessions/101: missing "description".',
    );
    expect(() => validateContent('sessions', '101', { ...session, speaker: 'ada' })).toThrow(
      'sessions/101: unknown field "speaker". Hoverboard doesn\'t read it.',
    );
  });

  it('validates documents in subcollections', () => {
    expect(() => validateContent('team/0/members', '0', { name: 'Ada' })).toThrow(
      'team/0/members/0: missing "order".',
    );
  });

  it('rejects extra fields on partner groups and teams', () => {
    expect(() => validateContent('team', '0', { title: 'Organizers' })).not.toThrow();
    expect(() => validateContent('team', '0', { title: 'Organizers', members: [] })).toThrow(
      'team/0: unknown field "members".',
    );
  });

  it('passes documents outside the content collections', () => {
    expect(() => validateContent('config', 'notifications', { icon: '' })).not.toThrow();
    expect(() => validateContent('featuredSessions', 'user', { 101: true })).not.toThrow();
  });

  it('rejects the old schedule fields', () => {
    expect(() => validateContent('sessions', '101', { ...session, extend: 2 })).toThrow(
      'sessions/101: unknown field "extend".',
    );
  });
});

describe('validateSchedule', () => {
  const tracks = [
    { id: 'main', title: 'Main hall' },
    { id: 'workshops', title: 'Workshops', days: ['2027-10-16'] },
  ];
  const at = (startTime: string, endTime: string, track?: string, day = '2027-10-15') => ({
    ...session,
    day,
    startTime,
    endTime,
    ...(track ? { track } : {}),
  });

  it('accepts the demo sessions with the demo tracks', () => {
    expect(() => validateSchedule(seed.sessions)).not.toThrow();
  });

  it('names every session the schedule cannot show', () => {
    expect(() =>
      validateSchedule(
        {
          gone: at('09:00', '09:40', 'gone'),
          'wrong-day': at('09:00', '09:40', 'workshops'),
          backwards: at('10:00', '09:00', 'main'),
          a: at('11:00', '11:40', 'main'),
          b: at('11:20', '12:00', 'main'),
          later: session,
        },
        tracks,
      ),
    ).toThrow(
      [
        'Invalid schedule:',
        '  sessions/a and sessions/b overlap on 2027-10-15 in main',
        '  sessions/backwards: endTime 09:00 is not after startTime 10:00',
        '  sessions/gone: track "gone" is not in schedule.tracks in site.json',
        '  sessions/wrong-day: track "workshops" is not on 2027-10-15',
      ].join('\n'),
    );
  });
});

describe('siteTracks', () => {
  it('reads schedule.tracks from site.json', () => {
    expect(siteTracks().map(({ id }) => id)).toEqual([
      'expo-hall',
      'conference-hall',
      'workshops-hall',
    ]);
  });
});
