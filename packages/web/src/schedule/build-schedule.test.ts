import { describe, expect, it } from 'vitest';
import data from '../../../../docs/default-firebase-data.json';
import site from '../../../config/site.json';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { type BuiltDay, type Track, buildSchedule, scheduleErrors } from './build-schedule';

const DAY = '2027-10-15';
const tracks: Track[] = [
  { id: 'main', title: 'Main hall' },
  { id: 'room-2', title: 'Room 2' },
];

const session = (id: string, fields: Partial<Session> = {}): Session => ({
  id,
  title: `Session ${id}`,
  description: '',
  ...fields,
});

const at = (startTime: string, endTime: string, track?: string, day = DAY) => ({
  day,
  startTime,
  endTime,
  ...(track ? { track } : {}),
});

const speaker = (id: string, name: string, fields: Partial<Speaker> = {}) =>
  ({ id, name, ...fields }) as Speaker;

const build = (
  sessions: Session[],
  speakers: Speaker[] = [],
  options: { published?: boolean; tracks?: Track[] } = {},
) => buildSchedule({ sessions, speakers }, { published: true, tracks, ...options });

/** Each block of a day, as `id: gridArea`, by the row it starts in. */
const grid = (day: BuiltDay | undefined) =>
  day?.timeslots.map(({ startTime, endTime, sessions }) => [
    `${startTime}-${endTime}`,
    ...sessions.flatMap(({ gridArea, items }) => items.map(({ id }) => `${id}: ${gridArea}`)),
  ]);

describe('buildSchedule', () => {
  it('gives scheduled sessions their times, duration and track', () => {
    const { sessions } = build([session('talk', at('09:00', '10:30', 'room-2'))]);

    expect(sessions[0]).toEqual({
      id: 'talk',
      title: 'Session talk',
      description: '',
      mainTag: 'General',
      speakers: [],
      day: DAY,
      startTime: '09:00',
      endTime: '10:30',
      duration: { hh: 1, mm: 30 },
      track: { id: 'room-2', title: 'Room 2' },
    });
  });

  it('keeps sessions without times off the schedule', () => {
    const { schedule, sessions } = build([
      session('talk', at('09:00', '09:40', 'main')),
      session('later'),
    ]);

    expect(grid(schedule[0])).toEqual([['09:00-09:40', 'talk: 1 / 1 / 2 / 2']]);
    expect(sessions[0]).toEqual({
      id: 'later',
      title: 'Session later',
      description: '',
      mainTag: 'General',
      speakers: [],
    });
  });

  it('leaves out every time and the schedule until it is published', () => {
    const { schedule, sessions } = build([session('talk', at('09:00', '09:40', 'main'))], [], {
      published: false,
    });

    expect(schedule).toEqual([]);
    expect(sessions[0]).not.toHaveProperty('day');
    expect(sessions[0]).not.toHaveProperty('startTime');
    expect(sessions[0]).not.toHaveProperty('endTime');
    expect(sessions[0]).not.toHaveProperty('duration');
    expect(sessions[0]).not.toHaveProperty('track');
  });

  it('spans every track for a session without one, and several rows for a long one', () => {
    const { schedule } = build([
      session('keynote', at('09:00', '10:00')),
      session('workshop', at('10:00', '12:00', 'room-2')),
      session('first', at('10:00', '10:20', 'main')),
      session('second', at('10:20', '10:40', 'main')),
      session('third', at('11:00', '12:00', 'main')),
    ]);

    expect(grid(schedule[0])).toEqual([
      ['09:00-10:00', 'keynote: 1 / 1 / 2 / 3'],
      ['10:00-10:20', 'first: 2 / 1 / 3 / 2', 'workshop: 2 / 2 / 6 / 3'],
      ['10:20-10:40', 'second: 3 / 1 / 4 / 2'],
      ['10:40-11:00'],
      ['11:00-12:00', 'third: 5 / 1 / 6 / 2'],
    ]);
  });

  it('shows the tracks of each day, in the order of the config', () => {
    const { schedule } = build(
      [
        session('a', at('09:00', '09:40', 'workshops', '2027-10-16')),
        session('b', at('09:00', '09:40', 'main', '2027-10-16')),
        session('c', at('09:00', '09:40', 'main')),
      ],
      [],
      { tracks: [...tracks, { id: 'workshops', title: 'Workshops', days: ['2027-10-16'] }] },
    );

    expect(schedule.map(({ date, tracks: dayTracks }) => [date, dayTracks])).toEqual([
      [
        DAY,
        [
          { id: 'main', title: 'Main hall' },
          { id: 'room-2', title: 'Room 2' },
        ],
      ],
      [
        '2027-10-16',
        [
          { id: 'main', title: 'Main hall' },
          { id: 'room-2', title: 'Room 2' },
          { id: 'workshops', title: 'Workshops' },
        ],
      ],
    ]);
    expect(grid(schedule[1])).toEqual([['09:00-09:40', 'b: 1 / 1 / 2 / 2', 'a: 1 / 3 / 2 / 4']]);
  });

  it('has one column without tracks', () => {
    const { schedule } = build(
      [session('a', at('09:00', '09:40')), session('b', at('10:00', '10:40'))],
      [],
      { tracks: [] },
    );

    expect(schedule[0]!.tracks).toEqual([]);
    expect(grid(schedule[0])).toEqual([
      ['09:00-09:40', 'a: 1 / 1 / 2 / 2'],
      ['09:40-10:00'],
      ['10:00-10:40', 'b: 3 / 1 / 4 / 2'],
    ]);
  });

  it('keeps sessions in a missing track, or one not on their day, off the schedule', () => {
    const { schedule, sessions } = build(
      [
        session('gone', at('09:00', '09:40', 'gone')),
        session('wrong-day', at('09:00', '09:40', 'workshops')),
        session('talk', at('10:00', '10:40', 'main')),
      ],
      [],
      { tracks: [...tracks, { id: 'workshops', title: 'Workshops', days: ['2027-10-16'] }] },
    );

    expect(grid(schedule[0])).toEqual([['10:00-10:40', 'talk: 1 / 1 / 2 / 2']]);
    expect(sessions.find(({ id }) => id === 'gone')).not.toHaveProperty('track');
  });

  it('skips speakers that a session lists but that do not exist', () => {
    const ada = speaker('ada', 'Ada');
    const { sessions } = build([session('talk', { speakers: ['ada', 'gone'] })], [ada]);

    expect(sessions[0]!.speakers).toEqual([ada]);
  });

  it('builds only from the sessions and speakers it gets, so deleted ones are gone', () => {
    const before = build(
      [session('a', { speakers: ['ada'] }), session('b', { speakers: ['ada'] })],
      [speaker('ada', 'Ada')],
    );
    const after = build([session('a', { speakers: ['ada', 'grace'] })], [speaker('ada', 'Ada')]);

    expect(before.speakers[0]!.sessions.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(after.speakers.map(({ id }) => id)).toEqual(['ada']);
    expect(after.speakers[0]!.sessions.map(({ id }) => id)).toEqual(['a']);
    expect(after.sessions.map(({ id }) => id)).toEqual(['a']);
  });

  it('gives each speaker their sessions in schedule order, and their tags', () => {
    const { speakers } = build(
      [
        session('unscheduled', { speakers: ['ada'], tags: ['Cloud'] }),
        session('late', { ...at('11:00', '11:40', 'main'), speakers: ['ada'], tags: ['Web'] }),
        session('early', {
          ...at('09:00', '09:40', 'main'),
          speakers: ['ada'],
          tags: ['Android', 'Web'],
        }),
      ],
      [speaker('ada', 'Ada'), speaker('grace', 'Grace')],
    );

    expect(speakers[0]!.sessions.map(({ id }) => id)).toEqual(['early', 'late', 'unscheduled']);
    expect(speakers[0]!.tags).toEqual(['Android', 'Web', 'Cloud']);
    expect(speakers[1]).toMatchObject({ id: 'grace', sessions: [], tags: [] });
  });

  it('uses the first tag as the main tag, and collects the tags of each day', () => {
    const { schedule, sessions } = build([
      session('a', { ...at('09:00', '09:40', 'main'), tags: ['Web', 'Cloud'] }),
      session('b', { ...at('09:00', '09:40', 'room-2'), tags: ['Android', 'Web'] }),
      session('c', at('10:00', '10:40')),
    ]);

    expect(sessions.map(({ mainTag }) => mainTag)).toEqual(['Web', 'Android', 'General']);
    expect(schedule[0]!.tags).toEqual(['Web', 'Cloud', 'Android']);
  });

  it('lists speakers by name, ignoring their order', () => {
    const { speakers } = build(
      [],
      [
        speaker('c', 'Grace', { order: 0 }),
        speaker('b', 'Ada', { order: 2 }),
        speaker('a', 'Ada', { order: 1 }),
      ],
    );

    expect(speakers.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });

  it('lists sessions by ID and days by date', () => {
    const { schedule, sessions } = build([
      session('b', at('09:00', '09:40', 'main', '2027-10-16')),
      session('a', at('09:00', '09:40', 'main')),
    ]);

    expect(sessions.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(schedule.map(({ date }) => date)).toEqual([DAY, '2027-10-16']);
  });
});

describe('scheduleErrors', () => {
  const withWorkshops = [...tracks, { id: 'workshops', title: 'Workshops', days: ['2027-10-16'] }];

  it('accepts sessions that fit, and sessions without times', () => {
    expect(
      scheduleErrors(
        [
          session('keynote', at('09:00', '10:00')),
          session('a', at('10:00', '10:20', 'main')),
          session('b', at('10:20', '10:40', 'main')),
          session('c', at('10:00', '11:00', 'room-2')),
          session('d', at('10:00', '11:00', 'workshops', '2027-10-16')),
          session('later'),
        ],
        withWorkshops,
      ),
    ).toEqual([]);
  });

  it('names a track that is not in site.json, or not on the day', () => {
    expect(
      scheduleErrors(
        [
          session('a', at('09:00', '09:40', 'gone')),
          session('b', at('09:00', '09:40', 'workshops')),
        ],
        withWorkshops,
      ),
    ).toEqual([
      'sessions/a: track "gone" is not in schedule.tracks in site.json',
      'sessions/b: track "workshops" is not on 2027-10-15',
    ]);
  });

  it('names a session that ends before it starts', () => {
    expect(scheduleErrors([session('a', at('10:00', '09:40', 'main'))], tracks)).toEqual([
      'sessions/a: endTime 09:40 is not after startTime 10:00',
    ]);
  });

  it('names both sessions that overlap in a track, or across every track', () => {
    expect(
      scheduleErrors(
        [
          session('a', at('09:00', '09:40', 'main')),
          session('b', at('09:30', '10:00', 'main')),
          session('c', at('09:30', '10:00', 'room-2')),
          session('lunch', at('09:50', '11:00')),
          session('other-day', at('09:00', '09:40', 'main', '2027-10-16')),
        ],
        tracks,
      ),
    ).toEqual([
      'sessions/a and sessions/b overlap on 2027-10-15 in main',
      'sessions/b and sessions/lunch overlap on 2027-10-15 in main',
      'sessions/c and sessions/lunch overlap on 2027-10-15 in room-2',
    ]);
  });

  it('accepts the demo data', () => {
    expect(
      scheduleErrors(
        Object.entries(data.sessions).map(([id, fields]) => ({ ...fields, id }) as Session),
        site.schedule.tracks,
      ),
    ).toEqual([]);
  });
});
