import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventDates } from '../config/site';
import { eventIsOver, getDate, getEventDates, getScheduleDay, onDates } from './dates';

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

  it('shows a date without a time as that day, in any time zone', () => {
    const toLocaleString = vi.spyOn(Date.prototype, 'toLocaleString');

    expect(getDate('2016-09-09')).toBe('Sep 9, 2016');
    expect(toLocaleString).toHaveBeenCalledWith('en', expect.objectContaining({ timeZone: 'UTC' }));
    toLocaleString.mockRestore();
  });

  it('formats in the active locale', () => {
    localization.getLocale.mockReturnValue('ja');

    expect(getDate('2016-09-09T12:00:00')).toBe('2016年9月9日');
  });
});

describe('getEventDates', () => {
  afterEach(() => {
    localization.getLocale.mockReturnValue('en');
  });

  // Intl puts thin spaces around the dash in a range.
  const text = (value: string) => value.replaceAll('\u2009', ' ');

  it('formats the event dates from site.json', () => {
    expect(text(getEventDates())).toBe('October 13 – 14, 2017');
  });

  it('formats one day without a range', () => {
    expect(getEventDates({ start: '2027-10-15', end: '2027-10-15' })).toBe('October 15, 2027');
  });

  it('formats days in different months and years', () => {
    expect(text(getEventDates({ start: '2027-12-31', end: '2028-01-01' }))).toBe(
      'December 31, 2027 – January 1, 2028',
    );
  });

  it('formats in the active locale', () => {
    localization.getLocale.mockReturnValue('es');

    expect(getEventDates()).toBe('13–14 de octubre de 2017');
  });
});

describe('onDates', () => {
  // The demo event is in Kyiv, three hours ahead of UTC in October.
  const at = (instant: string) => Date.parse(instant);

  it('counts days in the event time zone, from the first to the last, both included', () => {
    const window = { from: '2027-10-15', until: '2027-10-16' };

    expect(onDates(at('2027-10-14T20:59:00Z'), window)).toBe(false);
    expect(onDates(at('2027-10-14T21:00:00Z'), window)).toBe(true);
    expect(onDates(at('2027-10-16T20:59:00Z'), window)).toBe(true);
    expect(onDates(at('2027-10-16T21:00:00Z'), window)).toBe(false);
  });

  it('has no start or end without them', () => {
    expect(onDates(at('2000-01-01T00:00:00Z'), { until: '2027-10-16' })).toBe(true);
    expect(onDates(at('2099-01-01T00:00:00Z'), { from: '2027-10-15' })).toBe(true);
    expect(onDates(at('2099-01-01T00:00:00Z'), {})).toBe(true);
  });
});

describe('eventIsOver', () => {
  it('is over once the last day has passed', () => {
    expect(eventIsOver(Date.parse(`${eventDates.end}T12:00:00Z`))).toBe(false);
    expect(eventIsOver(Date.parse(`${eventDates.end}T23:00:00Z`))).toBe(true);
  });
});

describe('getScheduleDay', () => {
  afterEach(() => {
    localization.getLocale.mockReturnValue('en');
  });

  it('formats a day as month and day, in the active locale', () => {
    expect(getScheduleDay('2016-09-09')).toBe('September 9');

    localization.getLocale.mockReturnValue('es');

    expect(getScheduleDay('2016-09-09')).toBe('9 de septiembre');
  });
});
