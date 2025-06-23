import { beforeEach, describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import {
  createTimeWindow,
  filterUpcomingTimeslots,
  getTodayDateString,
  isBetween,
  parseTimeAndGetFromNow,
  parseTimeAndSubtract,
} from '../src/time';

// Mock Date to control time for testing
const MOCK_TIME = new Date('2025-06-22T14:30:00.000Z');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(MOCK_TIME);
});

afterAll(() => {
  jest.useRealTimers();
});

describe('Time utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayDateString', () => {
    it('should return today date in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      expect(result).toBe('2025-06-22');
    });

    it('should return today date with positive timezone offset', () => {
      const result = getTodayDateString('+05:00');
      expect(result).toBe('2025-06-22');
    });

    it('should handle negative timezone offset', () => {
      const result = getTodayDateString('-08:00');
      expect(result).toBe('2025-06-22');
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
      const result = parseTimeAndSubtract('15:00', '+02:00', 10);

      expect(result.toISOString()).toBe('2025-06-22T12:50:00.000Z');
    });

    it('should handle different timezones', () => {
      const result = parseTimeAndSubtract('09:30', '-05:00', 5);

      expect(result.toISOString()).toBe('2025-06-22T14:25:00.000Z');
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
      const result = parseTimeAndGetFromNow('14:00', '+00:00');

      expect(result).toContain('ago');
    });

    it('should handle future times', () => {
      // For a time in the future (15:00 UTC today from 14:30 UTC)
      const result = parseTimeAndGetFromNow('15:00', '+00:00');

      expect(result).toContain('in');
    });

    it('should work with different timezones', () => {
      // Test that the function doesn't throw and returns a string
      const result = parseTimeAndGetFromNow('09:00', '-05:00');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('filterUpcomingTimeslots', () => {
    const mockTimeslots = [
      { id: '1', startTime: '14:00' },
      { id: '2', startTime: '14:30' },
      { id: '3', startTime: '15:00' },
      { id: '4', startTime: '16:00' },
    ];

    it('should filter timeslots within the time window', () => {
      const timeWindow = createTimeWindow(3, 3);

      const result = filterUpcomingTimeslots(
        mockTimeslots,
        timeWindow,
        10, // notification offset
        '+00:00',
      );

      // With a 10-minute notification offset, 14:30 start time becomes 14:20 notification time
      // Current time is 14:30, so the window is 14:27-14:33
      // 14:20 is outside this window, so it shouldn't be included
      expect(result).toEqual([]);
    });

    it('should include timeslots that match the notification window', () => {
      const timeWindow = createTimeWindow(15, 5); // 14:15 to 14:35

      const result = filterUpcomingTimeslots(mockTimeslots, timeWindow, 10, '+00:00');

      // 14:30 start time with 10min offset = 14:20 notification time (within 14:15-14:35)
      // 15:00 start time with 10min offset = 14:50 notification time (outside window)
      expect(result).toEqual([{ id: '2', startTime: '14:30' }]);
    });

    it('should handle empty timeslots array', () => {
      const timeWindow = createTimeWindow(3, 3);

      const result = filterUpcomingTimeslots([], timeWindow, 10, '+00:00');

      expect(result).toEqual([]);
    });
  });
});
