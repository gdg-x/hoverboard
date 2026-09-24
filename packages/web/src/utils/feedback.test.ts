import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Session } from '../models/session';
import { timezoneOffset } from './data';
import { acceptingFeedback } from './feedback';

const pad = (value: number): string => value.toString().padStart(2, '0');

/**
 * Builds a `day`/`startTime` pair that, once parsed by `acceptingFeedback` as
 * local time and re-adjusted by `timezoneOffset`, lands `offsetMinutes`
 * minutes away from `now`. This keeps the test independent of the machine's
 * actual timezone.
 */
const sessionStartingAt = (
  now: Date,
  offsetMinutes: number,
): Pick<Session, 'day' | 'startTime'> => {
  const totalOffset = parseInt(timezoneOffset) - now.getTimezoneOffset();
  const targetConvertedTime = now.getTime() + offsetMinutes * 60 * 1000;
  const currentTime = targetConvertedTime - totalOffset * 60 * 1000;
  const local = new Date(currentTime);

  return {
    day: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`,
    startTime: `${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`,
  };
};

describe('acceptingFeedback', () => {
  const now = new Date('2024-01-15T12:00:00');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true just after a session started', () => {
    const session = sessionStartingAt(now, -60);

    expect(acceptingFeedback(session as Session)).toBe(true);
  });

  it('returns false for a session more than a week ago', () => {
    const session = sessionStartingAt(now, -8 * 24 * 60);

    expect(acceptingFeedback(session as Session)).toBe(false);
  });

  it('returns false for a session that has not started yet', () => {
    const session = sessionStartingAt(now, 60);

    expect(acceptingFeedback(session as Session)).toBe(false);
  });
});
