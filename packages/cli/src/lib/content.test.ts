import { describe, expect, it } from 'vitest';
import seed from '../../../../docs/default-firebase-data.json';
import { siteTracks, validateContent, validateSchedule, validateSeedData } from './content.js';

const session = { title: 'Keynote', description: 'Opening talk' };

describe('validateSeedData', () => {
  it('accepts docs/default-firebase-data.json', () => {
    expect(() => validateSeedData(seed)).not.toThrow();
  });

  it('rejects unknown top-level collections', () => {
    expect(() => validateSeedData({ ...seed, triggers: {} })).toThrow('Invalid seed data');
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
      'sessions/101 must have properties startTime, endTime when property day is present',
    );
    expect(() =>
      validateContent('sessions', '101', { ...session, ...time, startTime: '9:00' }),
    ).toThrow('sessions/101/startTime must match pattern');
  });

  it('names the document and the problem when a document is invalid', () => {
    expect(() => validateContent('sessions', '101', { title: 'Keynote' })).toThrow(
      "Invalid sessions/101: sessions/101 must have required property 'description'",
    );
    expect(() => validateContent('sessions', '101', { ...session, speaker: 'ada' })).toThrow(
      'must NOT have additional properties',
    );
  });

  it('validates documents in subcollections', () => {
    expect(() => validateContent('team/0/members', '0', { name: 'Ada' })).toThrow(
      'Invalid team/0/members/0',
    );
  });

  it('rejects extra fields on partner groups and teams', () => {
    expect(() => validateContent('team', '0', { title: 'Organizers' })).not.toThrow();
    expect(() => validateContent('team', '0', { title: 'Organizers', members: [] })).toThrow(
      'must NOT have unevaluated properties',
    );
  });

  it('passes documents outside the content collections', () => {
    expect(() => validateContent('config', 'notifications', { icon: '' })).not.toThrow();
    expect(() => validateContent('featuredSessions', 'user', { 101: true })).not.toThrow();
  });

  it('rejects the old schedule fields', () => {
    expect(() => validateContent('sessions', '101', { ...session, extend: 2 })).toThrow(
      'must NOT have additional properties',
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
