import { describe, expect, it } from 'vitest';
import data from '../../../../../docs/default-firebase-data.json';
import site from '../../../../config/site.json';
import { type OldScheduleDay, convertSchedule, trackId } from './convert.js';

const tracks = [{ title: 'Main hall' }, { title: 'Room 2' }];
const day = (
  timeslots: OldScheduleDay['timeslots'],
  extra: OldScheduleDay = {},
): OldScheduleDay => ({
  tracks,
  timeslots,
  ...extra,
});

describe('trackId', () => {
  it('turns a title into an ID', () => {
    expect(trackId('Expo hall')).toBe('expo-hall');
    expect(trackId(' Room #2 (B) ')).toBe('room-2-b');
  });
});

describe('convertSchedule', () => {
  it('gives each session its day, times and track', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([
          { startTime: '09:00', endTime: '09:30', sessions: [{ items: ['keynote'] }] },
          {
            startTime: '10:00',
            endTime: '10:40',
            sessions: [{ items: ['web'] }, { items: ['android'] }],
          },
        ]),
      },
      ['keynote', 'web', 'android'],
    );

    expect(result.tracks).toEqual([
      { id: 'main-hall', title: 'Main hall' },
      { id: 'room-2', title: 'Room 2' },
    ]);
    expect(result.times).toEqual({
      keynote: { day: '2027-10-15', startTime: '09:00', endTime: '09:30' },
      web: { day: '2027-10-15', startTime: '10:00', endTime: '10:40', track: 'main-hall' },
      android: { day: '2027-10-15', startTime: '10:00', endTime: '10:40', track: 'room-2' },
    });
    expect(result.warnings).toEqual([]);
  });

  it('shares a split timeslot evenly, in whole minutes', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([
          {
            startTime: '11:00',
            endTime: '11:40',
            sessions: [{ items: ['a', 'b', 'c'] }, { items: ['d'] }],
          },
        ]),
      },
      ['a', 'b', 'c', 'd'],
    );

    expect(result.times['a']).toMatchObject({ startTime: '11:00', endTime: '11:13' });
    expect(result.times['b']).toMatchObject({ startTime: '11:13', endTime: '11:26' });
    expect(result.times['c']).toMatchObject({ startTime: '11:26', endTime: '11:40' });
  });

  it('ends a session that spans timeslots at the end of its last one', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([
          {
            startTime: '14:00',
            endTime: '14:40',
            sessions: [{ items: ['talk'] }, { items: ['workshop'], extend: 2 }],
          },
          { startTime: '14:50', endTime: '15:30', sessions: [{ items: ['other'] }, { items: [] }] },
        ]),
      },
      ['talk', 'workshop', 'other'],
    );

    expect(result.times['workshop']).toEqual({
      day: '2027-10-15',
      startTime: '14:00',
      endTime: '15:30',
      track: 'room-2',
    });
  });

  it('ends a longer session where a session across every track starts', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([
          {
            startTime: '11:00',
            endTime: '11:40',
            sessions: [{ items: ['talk'] }, { items: ['workshop'], extend: 3 }],
          },
          { startTime: '11:50', endTime: '12:30', sessions: [{ items: ['next'] }, { items: [] }] },
          { startTime: '12:30', endTime: '14:00', sessions: [{ items: ['lunch'] }] },
        ]),
      },
      ['talk', 'workshop', 'next', 'lunch'],
    );

    expect(result.times['workshop']).toMatchObject({ startTime: '11:00', endTime: '12:30' });
    expect(result.times['lunch']).toEqual({
      day: '2027-10-15',
      startTime: '12:30',
      endTime: '14:00',
    });
    expect(result.warnings).toEqual([
      'A session on 2027-10-15 in room-2 now ends at 12:30, when a session across every track starts.',
    ]);
  });

  it('copies a session for each extra time on the schedule', () => {
    const lunch = (startTime: string) => ({
      startTime,
      endTime: '14:00',
      sessions: [{ items: ['lunch'] }],
    });
    const result = convertSchedule(
      {
        '2027-10-16': day([lunch('12:30')]),
        '2027-10-15': day([lunch('13:00')]),
      },
      ['lunch', 'lunch-2'],
    );

    expect(result.times['lunch']).toMatchObject({ day: '2027-10-15', startTime: '13:00' });
    expect(result.copies).toEqual({
      'lunch-3': { from: 'lunch', day: '2027-10-16', startTime: '12:30', endTime: '14:00' },
    });
    expect(result.warnings).toEqual([
      'Session lunch is on the schedule more than once, so lunch-3 is a copy of it on 2027-10-16 at 12:30.',
    ]);
  });

  it('lists the days of a track that is not on every day', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([], { tracks: [{ title: 'Main hall' }] }),
        '2027-10-16': day([]),
      },
      [],
    );

    expect(result.tracks).toEqual([
      { id: 'main-hall', title: 'Main hall' },
      { id: 'room-2', title: 'Room 2', days: ['2027-10-16'] },
    ]);
  });

  it('skips sessions that do not exist and timeslots without times', () => {
    const result = convertSchedule(
      {
        '2027-10-15': day([
          { startTime: '09:00', endTime: '09:30', sessions: [{ items: ['gone'] }] },
          { sessions: [{ items: ['talk'] }] },
        ]),
      },
      ['talk'],
    );

    expect(result.times).toEqual({});
    expect(result.warnings).toEqual([
      "The schedule on 2027-10-15 lists session gone, which doesn't exist.",
      'A timeslot on 2027-10-15 has no start or end time, so it was skipped.',
    ]);
  });

  it('matches the converted demo data', () => {
    const { schedule, sessions } = data as unknown as {
      schedule: Record<string, OldScheduleDay>;
      sessions: Record<string, Record<string, unknown>>;
    };
    const copies = new Set(Object.keys(sessions).filter((id) => /-\d+$/.test(id)));
    const result = convertSchedule(
      schedule,
      Object.keys(sessions).filter((id) => !copies.has(id)),
    );
    const pick = ({ day: date, startTime, endTime, track }: Record<string, unknown>) => ({
      day: date,
      startTime,
      endTime,
      ...(track ? { track } : {}),
    });

    for (const [id, time] of Object.entries(result.times)) {
      expect(pick(sessions[id]!), id).toEqual(time);
    }
    for (const [id, { from, ...time }] of Object.entries(result.copies)) {
      expect(pick(sessions[id]!), id).toEqual(time);
      expect(sessions[id]!['title']).toBe(sessions[from]!['title']);
    }
    expect(new Set(Object.keys(result.copies))).toEqual(copies);
    expect(site.schedule.tracks).toEqual(result.tracks);
  });
});
