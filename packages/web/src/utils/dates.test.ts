import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDate } from './dates';

const localization = vi.hoisted(() => ({ getLocale: vi.fn(() => 'en') }));

vi.mock('./localization', () => localization);

describe('getDate', () => {
  afterEach(() => {
    localization.getLocale.mockReturnValue('en');
  });

  it('formats a date string as month, day, year', () => {
    expect(getDate('2016-09-09T12:00:00')).toBe('Sep 9, 2016');
  });

  it('formats a Date instance', () => {
    expect(getDate(new Date('2016-09-09T00:00:00'))).toBe('Sep 9, 2016');
  });

  it('formats in the active locale', () => {
    localization.getLocale.mockReturnValue('ja');

    expect(getDate('2016-09-09T12:00:00')).toBe('2016年9月9日');
  });
});
