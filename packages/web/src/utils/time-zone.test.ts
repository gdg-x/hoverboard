import { describe, expect, it } from 'vitest';
import { wallClock, zonedTime } from './time-zone';

describe('wallClock', () => {
  it('reads the date and time in a time zone', () => {
    const instant = new Date('2024-07-02T22:30:00Z');

    expect(wallClock(instant, 'UTC')).toEqual({ date: '2024-07-02', time: '22:30' });
    expect(wallClock(instant, 'Europe/Kyiv')).toEqual({ date: '2024-07-03', time: '01:30' });
    expect(wallClock(instant, 'America/New_York')).toEqual({ date: '2024-07-02', time: '18:30' });
  });

  it('uses 00 for midnight', () => {
    expect(wallClock(new Date('2024-07-02T00:05:00Z'), 'UTC').time).toBe('00:05');
  });
});

describe('zonedTime', () => {
  it.each([
    ['UTC', '2024-01-02', '10:00', '2024-01-02T10:00:00.000Z'],
    ['Europe/Kyiv in winter', '2024-01-02', '10:00', '2024-01-02T08:00:00.000Z'],
    ['Europe/Kyiv in summer', '2024-07-02', '10:00', '2024-07-02T07:00:00.000Z'],
    ['America/New_York', '2024-07-02', '23:30', '2024-07-03T03:30:00.000Z'],
    ['Asia/Kolkata', '2024-07-02', '09:00', '2024-07-02T03:30:00.000Z'],
  ])('converts a time in %s to UTC', (label, day, time, expected) => {
    const timeZone = label.split(' ')[0]!;

    expect(zonedTime(day, time, timeZone).toISOString()).toBe(expected);
  });

  it('uses the offset in effect just before clocks go back', () => {
    // Kyiv goes from +03:00 to +02:00 at 04:00 local time on 2024-10-27.
    expect(zonedTime('2024-10-27', '02:30', 'Europe/Kyiv').toISOString()).toBe(
      '2024-10-26T23:30:00.000Z',
    );
    expect(zonedTime('2024-10-27', '05:00', 'Europe/Kyiv').toISOString()).toBe(
      '2024-10-27T03:00:00.000Z',
    );
  });
});
