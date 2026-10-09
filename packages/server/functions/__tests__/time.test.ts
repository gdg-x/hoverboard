import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTimeWindow,
  filterUpcoming,
  getTodayDateString,
  isBetween,
  parseTimeAndGetFromNow,
  parseTimeAndSubtract,
} from '../src/time';

// Mock Date to control time for testing
const MOCK_TIME = new Date('2025-06-22T14:30:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_TIME);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('Time utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayDateString', () => {
    it('should return today date in YYYY-MM-DD format', () => {
      expect(getTodayDateString('UTC')).toBe('2025-06-22');
    });

    it('should return the next day where it is already tomorrow', () => {
      expect(getTodayDateString('Pacific/Auckland')).toBe('2025-06-23');
    });

    it('should return the date in a time zone behind UTC', () => {
      expect(getTodayDateString('America/Los_Angeles')).toBe('2025-06-22');
    });
  });

  describe('createTimeWindow', () => {
    it('should create a time window around current time', () => {
      const window = createTimeWindow(3, 3);

      expect(window.before.toISOString()).toBe('2025-06-22T14:27:00.000Z');
      expect(window.after.toISOString()).toBe('2025-06-22T14:33:00.000Z');
    });

    it('should handle different before and after minutes', () => {
      const window = createTimeWindow(5, 10);

      expect(window.before.toISOString()).toBe('2025-06-22T14:25:00.000Z');
      expect(window.after.toISOString()).toBe('2025-06-22T14:40:00.000Z');
    });
  });

  describe('parseTimeAndSubtract', () => {
    it('should parse time string and subtract minutes', () => {
      const result = parseTimeAndSubtract('15:00', 'Europe/Kyiv', 10);

      expect(result.toISOString()).toBe('2025-06-22T11:50:00.000Z');
    });

    it('should handle different timezones', () => {
      const result = parseTimeAndSubtract('09:30', 'America/New_York', 5);

      expect(result.toISOString()).toBe('2025-06-22T13:25:00.000Z');
    });

    it('should use today in the time zone, not in UTC', () => {
      const result = parseTimeAndSubtract('03:00', 'Pacific/Auckland', 0);

      expect(result.toISOString()).toBe('2025-06-22T15:00:00.000Z');
    });
  });

  describe('isBetween', () => {
    it('should return true when date is between two other dates', () => {
      const start = new Date('2025-06-22T14:00:00Z');
      const end = new Date('2025-06-22T15:00:00Z');
      const target = new Date('2025-06-22T14:30:00Z');

      expect(isBetween(target, start, end)).toBe(true);
    });

    it('should return false when date is before the range', () => {
      const start = new Date('2025-06-22T14:00:00Z');
      const end = new Date('2025-06-22T15:00:00Z');
      const target = new Date('2025-06-22T13:30:00Z');

      expect(isBetween(target, start, end)).toBe(false);
    });

    it('should return false when date is after the range', () => {
      const start = new Date('2025-06-22T14:00:00Z');
      const end = new Date('2025-06-22T15:00:00Z');
      const target = new Date('2025-06-22T15:30:00Z');

      expect(isBetween(target, start, end)).toBe(false);
    });
  });

  describe('parseTimeAndGetFromNow', () => {
    it('should handle past times', () => {
      // For a time in the past (14:00 UTC today from 14:30 UTC)
      const result = parseTimeAndGetFromNow('14:00', 'UTC');

      expect(result).toContain('ago');
    });

    it('should handle future times', () => {
      // For a time in the future (15:00 UTC today from 14:30 UTC)
      const result = parseTimeAndGetFromNow('15:00', 'UTC');

      expect(result).toContain('in');
    });

    it('should work with different timezones', () => {
      // 17:40 in Kyiv is 14:40 UTC.
      expect(parseTimeAndGetFromNow('17:40', 'Europe/Kyiv')).toBe('in 10 minutes');
    });
  });

  describe('filterUpcoming', () => {
    const mockSessions = [
      { id: '1', startTime: '14:00' },
      { id: '2', startTime: '14:30' },
      { id: '3', startTime: '15:00' },
      { id: '4', startTime: '16:00' },
    ];

    it('should filter sessions within the time window', () => {
      const timeWindow = createTimeWindow(3, 3);

      const result = filterUpcoming(
        mockSessions,
        timeWindow,
        10, // notification offset
        'UTC',
      );

      // With a 10-minute notification offset, 14:30 start time becomes 14:20 notification time
      // Current time is 14:30, so the window is 14:27-14:33
      // 14:20 is outside this window, so it shouldn't be included
      expect(result).toEqual([]);
    });

    it('should include sessions that match the notification window', () => {
      const timeWindow = createTimeWindow(15, 5); // 14:15 to 14:35

      const result = filterUpcoming(mockSessions, timeWindow, 10, 'UTC');

      // 14:30 start time with 10min offset = 14:20 notification time (within 14:15-14:35)
      // 15:00 start time with 10min offset = 14:50 notification time (outside window)
      expect(result).toEqual([{ id: '2', startTime: '14:30' }]);
    });

    it('should handle no sessions', () => {
      const timeWindow = createTimeWindow(3, 3);

      const result = filterUpcoming([], timeWindow, 10, 'UTC');

      expect(result).toEqual([]);
    });
  });
});
