import { describe, expect, it } from 'vitest';
import { getDate } from './dates';

describe('getDate', () => {
  it('formats a date string as month, day, year', () => {
    expect(getDate('2016-09-09T12:00:00')).toBe('Sep 9, 2016');
  });

  it('formats a Date instance', () => {
    expect(getDate(new Date('2016-09-09T00:00:00'))).toBe('Sep 9, 2016');
  });
});
