import { describe, expect, it } from 'vitest';
import {
  calculateEndTime,
  calculateStartTime,
  collectSpeakers,
  getDuration,
} from '../../src/utils/schedule-time';

describe('calculateStartTime', () => {
  const timeslot = { startTime: '09:00', sessions: [{ items: ['session-1', 'session-2'] }] };
  const sessions = { 'session-1': { endTime: '09:30' } };

  it('returns the timeslot start time for the first sub-session', () => {
    expect(calculateStartTime(2, 0, 0, sessions, timeslot)).toBe('09:00');
  });

  it('returns the previous sub-session end time for later sub-sessions', () => {
    expect(calculateStartTime(2, 1, 0, sessions, timeslot)).toBe('09:30');
  });

  it('returns the timeslot start time when there is only one sub-session', () => {
    expect(calculateStartTime(1, 0, 0, sessions, timeslot)).toBe('09:00');
  });
});

describe('calculateEndTime', () => {
  const day = {
    timeslots: [{ endTime: '09:30' }, { endTime: '10:00' }, { endTime: '10:30' }],
  };

  it('returns the timeslot end time when the session does not extend', () => {
    const timeslot = { endTime: '09:30', sessions: [{}] };

    expect(calculateEndTime(1, timeslot, 0, day, 0, '2025-06-22', 0)).toBe('09:30');
  });

  it('returns the extended timeslot end time when the session extends', () => {
    const timeslot = { endTime: '09:30', sessions: [{ extend: 2 }] };

    expect(calculateEndTime(1, timeslot, 0, day, 0, '2025-06-22', 0)).toBe('10:00');
  });

  it('splits the end time evenly across sub-sessions', () => {
    const timeslot = { startTime: '09:00', endTime: '10:00', sessions: [{}] };

    const firstHalf = calculateEndTime(2, timeslot, 0, day, 0, '2025-06-22', 0);
    const secondHalf = calculateEndTime(2, timeslot, 0, day, 0, '2025-06-22', 1);

    expect(firstHalf).toBe('9:30');
    expect(secondHalf).toBe('10:0');
  });
});

describe('getDuration', () => {
  it('calculates hours and minutes between two times on the same day', () => {
    expect(getDuration('2025-06-22', '09:00', '10:30')).toStrictEqual({ hh: 1, mm: 30 });
  });

  it('calculates a duration under an hour', () => {
    expect(getDuration('2025-06-22', '09:00', '09:45')).toStrictEqual({ hh: 0, mm: 45 });
  });

  it('calculates a zero duration when start and end match', () => {
    expect(getDuration('2025-06-22', '09:00', '09:00')).toStrictEqual({ hh: 0, mm: 0 });
  });
});

describe('collectSpeakers', () => {
  const speakersRaw = {
    ada: { name: 'Ada Lovelace', sessions: ['other-session'] },
    grace: { name: 'Grace Hopper', sessions: ['other-session'] },
  };

  it('maps speaker ids to speaker data, clearing sessions', () => {
    expect(collectSpeakers(['ada', 'grace'], speakersRaw)).toStrictEqual([
      { id: 'ada', name: 'Ada Lovelace', sessions: null },
      { id: 'grace', name: 'Grace Hopper', sessions: null },
    ]);
  });

  it('returns an empty array when no speaker ids are provided', () => {
    expect(collectSpeakers(undefined as unknown as string[], speakersRaw)).toStrictEqual([]);
  });
});
