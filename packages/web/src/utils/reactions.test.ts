import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptingReactions } from './reactions';

vi.mock('../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../config/site')>()),
  timeZone: 'Europe/Kyiv',
}));

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// 14:00 in Kyiv.
const now = new Date('2024-01-15T12:00:00Z');

describe('acceptingReactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is open before a session, during it and up to a week after it ends', () => {
    expect(acceptingReactions({ day: '2024-02-01', startTime: '10:00', endTime: '11:00' })).toBe(
      true,
    );
    expect(acceptingReactions({ day: '2024-01-15', startTime: '13:00', endTime: '15:00' })).toBe(
      true,
    );
    expect(acceptingReactions({ day: '2024-01-08', startTime: '13:00', endTime: '14:01' })).toBe(
      true,
    );
  });

  it('closes a week after the end, in the event time zone', () => {
    expect(acceptingReactions({ day: '2024-01-08', startTime: '13:00', endTime: '14:00' })).toBe(
      false,
    );
    vi.setSystemTime(now.getTime() - 60 * 1000);
    expect(acceptingReactions({ day: '2024-01-08', startTime: '13:00', endTime: '14:00' })).toBe(
      true,
    );
  });

  it('counts from the start without an end time', () => {
    vi.setSystemTime(new Date('2024-01-08T12:00:00Z').getTime() + WEEK_MS - 1);
    expect(acceptingReactions({ day: '2024-01-08', startTime: '14:00' })).toBe(true);
    vi.setSystemTime(new Date('2024-01-08T12:00:00Z').getTime() + WEEK_MS);
    expect(acceptingReactions({ day: '2024-01-08', startTime: '14:00' })).toBe(false);
  });

  it('is always open for a session without a day or a time', () => {
    expect(acceptingReactions({})).toBe(true);
    expect(acceptingReactions({ day: '2020-01-01' })).toBe(true);
  });
});
