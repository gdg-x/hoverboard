import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../models/session';
import { acceptingFeedback } from './feedback';

vi.mock('../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../config/site')>()),
  timeZone: 'Europe/Kyiv',
}));

const session = (day: string, startTime: string) => ({ day, startTime }) as Session;

describe('acceptingFeedback', () => {
  // 14:00 in Kyiv.
  const now = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true just after a session started', () => {
    expect(acceptingFeedback(session('2024-01-15', '13:59'))).toBe(true);
  });

  it('returns false for a session more than a week ago', () => {
    expect(acceptingFeedback(session('2024-01-07', '13:00'))).toBe(false);
  });

  it('returns false for a session that has not started yet in the event time zone', () => {
    expect(acceptingFeedback(session('2024-01-15', '14:01'))).toBe(false);
  });

  it('returns false for a session that is not in the schedule', () => {
    expect(acceptingFeedback({ id: 'session-1', title: 'Talk' } as Session)).toBe(false);
  });
});
