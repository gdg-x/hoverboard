import { describe, expect, it } from 'vitest';
import { sessionsSpeakersScheduleMap as sessionsSpeakersScheduleMapUntyped } from '../../src/schedule-generator/speakers-sessions-schedule-map';

type AnyRecord = Record<string, any>;
const sessionsSpeakersScheduleMap = sessionsSpeakersScheduleMapUntyped as (
  sessionsRaw: AnyRecord,
  speakersRaw: AnyRecord,
  scheduleRaw: AnyRecord,
) => { sessions: AnyRecord; schedule: AnyRecord; speakers: AnyRecord };

describe('sessionsSpeakersScheduleMap', () => {
  it('builds a single session into the schedule, tagging it with track/time/duration', () => {
    const sessionsRaw = { s1: { title: 'Talk one', tags: ['web'], speakers: ['ada'] } };
    const speakersRaw = { ada: { name: 'Ada Lovelace' } };
    const scheduleRaw = {
      '2025-06-22': {
        tracks: ['Track A'],
        dateReadable: 'June 22, 2025',
        timeslots: [{ startTime: '09:00', endTime: '10:00', sessions: [{ items: ['s1'] }] }],
      },
    };

    const { sessions, schedule, speakers } = sessionsSpeakersScheduleMap(
      sessionsRaw,
      speakersRaw,
      scheduleRaw,
    );

    expect(sessions.s1).toMatchObject({
      id: 's1',
      mainTag: 'web',
      day: '2025-06-22',
      track: 'Track A',
      startTime: '09:00',
      endTime: '10:00',
      duration: { hh: 1, mm: 0 },
      dateReadable: 'June 22, 2025',
      speakers: [{ id: 'ada', name: 'Ada Lovelace', sessions: null }],
    });

    expect(schedule['2025-06-22'].tags).toStrictEqual(['web']);
    expect(schedule['2025-06-22'].timeslots[0].sessions).toStrictEqual([
      { gridArea: '1 / 1 / 1 / 2', items: [sessions.s1] },
    ]);

    expect(speakers.ada).toStrictEqual({
      name: 'Ada Lovelace',
      id: 'ada',
      sessions: [sessions.s1],
      tags: ['web'],
    });
  });

  it('splits a timeslot into evenly-timed sub-sessions', () => {
    const sessionsRaw = {
      s1: { title: 'Talk one', tags: ['web'] },
      s2: { title: 'Talk two', tags: ['a11y'] },
    };
    const scheduleRaw = {
      '2025-06-22': {
        tracks: ['Track A'],
        dateReadable: 'June 22, 2025',
        timeslots: [{ startTime: '09:00', endTime: '10:00', sessions: [{ items: ['s1', 's2'] }] }],
      },
    };

    const { sessions } = sessionsSpeakersScheduleMap(sessionsRaw, {}, scheduleRaw);

    expect(sessions.s1.startTime).toBe('09:00');
    expect(sessions.s1.endTime).toBe('9:30');
    expect(sessions.s2.startTime).toBe('9:30');
    expect(sessions.s2.endTime).toBe('10:0');
  });

  it('extends a session across multiple timeslots using the following timeslot end time', () => {
    const sessionsRaw = { s1: { title: 'Keynote' } };
    const scheduleRaw = {
      '2025-06-22': {
        tracks: ['Track A'],
        dateReadable: 'June 22, 2025',
        timeslots: [
          { startTime: '09:00', endTime: '10:00', sessions: [{ items: ['s1'], extend: 2 }] },
          { startTime: '10:00', endTime: '11:00', sessions: [{ items: [] }] },
        ],
      },
    };

    const { sessions } = sessionsSpeakersScheduleMap(sessionsRaw, {}, scheduleRaw);

    expect(sessions.s1.startTime).toBe('09:00');
    expect(sessions.s1.endTime).toBe('11:00');
  });

  it('falls back to the session track only when the session does not already have one', () => {
    const sessionsRaw = {
      s1: { title: 'Talk one' },
      s2: { title: 'Talk two', track: 'Custom Track' },
    };
    const scheduleRaw = {
      '2025-06-22': {
        tracks: ['Track A', 'Track B'],
        dateReadable: 'June 22, 2025',
        timeslots: [
          {
            startTime: '09:00',
            endTime: '10:00',
            sessions: [{ items: ['s1'] }, { items: ['s2'] }],
          },
        ],
      },
    };

    const { sessions } = sessionsSpeakersScheduleMap(sessionsRaw, {}, scheduleRaw);

    expect(sessions.s1.track).toBe('Track A');
    expect(sessions.s2.track).toBe('Custom Track');
  });

  it('accumulates a speaker across multiple sessions with combined tags', () => {
    const sessionsRaw = {
      s1: { title: 'Talk one', tags: ['web'], speakers: ['ada'] },
      s2: { title: 'Talk two', tags: ['a11y'], speakers: ['ada'] },
    };
    const speakersRaw = { ada: { name: 'Ada Lovelace' } };
    const scheduleRaw = {
      '2025-06-22': {
        tracks: ['Track A', 'Track B'],
        dateReadable: 'June 22, 2025',
        timeslots: [
          {
            startTime: '09:00',
            endTime: '10:00',
            sessions: [{ items: ['s1'] }, { items: ['s2'] }],
          },
        ],
      },
    };

    const { speakers } = sessionsSpeakersScheduleMap(sessionsRaw, speakersRaw, scheduleRaw);

    expect(speakers.ada.tags).toStrictEqual(['web', 'a11y']);
    expect(speakers.ada.sessions).toHaveLength(2);
  });
});
