import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { readExport } from './data-format.js';
import { documentMessages, scheduleMessages, siteTracks } from './content.js';

const SAMPLE_DATA = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'sample-data');
const session = { title: 'Keynote', description: 'Opening talk' };

describe('documentMessages', () => {
  it('accepts a valid document', () => {
    expect(documentMessages('sessions/101', session)).toEqual([]);
  });

  it('accepts import fields on sessions and speakers', () => {
    expect(
      documentMessages('sessions/101', { ...session, source: 'sessionize', externalId: '42' }),
    ).toEqual([]);
  });

  it("accepts a session's day, times and track, all together or none", () => {
    const time = { day: '2027-10-15', startTime: '09:00', endTime: '09:40' };
    expect(documentMessages('sessions/101', { ...session, ...time })).toEqual([]);
    expect(documentMessages('sessions/101', { ...session, ...time, track: 'main-hall' })).toEqual(
      [],
    );
    expect(documentMessages('sessions/101', { ...session, day: '2027-10-15' })).toEqual([
      'sessions/101: "day" needs "startTime" too.',
      'sessions/101: "day" needs "endTime" too.',
    ]);
    expect(documentMessages('sessions/101', { ...session, ...time, startTime: '9:00' })).toEqual([
      'sessions/101: startTime "9:00" must be a time, HH:MM.',
    ]);
  });

  it('names the document, the field and the problem when a document is invalid', () => {
    expect(documentMessages('sessions/101', { title: 'Keynote' })).toEqual([
      'sessions/101: missing "description".',
    ]);
    expect(documentMessages('sessions/101', { ...session, speaker: 'ada' })).toEqual([
      'sessions/101: unknown field "speaker". Hoverboard doesn\'t read it.',
    ]);
  });

  it('checks documents in subcollections', () => {
    expect(documentMessages('team/0/members/0', { name: 'Ada' })).toContainEqual(
      expect.stringContaining('team/0/members/0: missing "order".'),
    );
  });

  it('rejects extra fields on partner groups and teams', () => {
    expect(documentMessages('team/0', { title: 'Organizers' })).toEqual([]);
    expect(documentMessages('team/0', { title: 'Organizers', members: [] })).toContainEqual(
      expect.stringContaining('team/0: unknown field "members".'),
    );
  });

  it('rejects the old schedule fields', () => {
    expect(documentMessages('sessions/101', { ...session, extend: 2 })).toEqual([
      'sessions/101: retired field "extend", which Hoverboard stopped reading in 4.0.0.',
    ]);
  });
});

describe('scheduleMessages', () => {
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

  it('accepts the sample sessions with the demo tracks', () => {
    const sessions = Object.fromEntries(
      readExport(SAMPLE_DATA)
        .documents.filter(({ path }) => path.startsWith('sessions/'))
        .map(({ path, data }) => [path.split('/')[1]!, data]),
    );
    expect(Object.keys(sessions).length).toBeGreaterThan(0);
    expect(scheduleMessages(sessions)).toEqual([]);
  });

  it('names every session the schedule cannot show', () => {
    expect(
      scheduleMessages(
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
    ).toEqual([
      'sessions/a and sessions/b overlap on 2027-10-15 in main',
      'sessions/backwards: endTime 09:00 is not after startTime 10:00',
      'sessions/gone: track "gone" is not in schedule.tracks in site.json',
      'sessions/wrong-day: track "workshops" is not on 2027-10-15',
    ]);
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
