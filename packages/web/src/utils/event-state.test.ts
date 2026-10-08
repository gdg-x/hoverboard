import { describe, expect, it } from 'vitest';
import { daysUntilStart, eventState } from './event-state';

const event = { startDate: '2026-10-13', endDate: '2026-10-14', timezone: 'Europe/Kyiv' };

describe('eventState', () => {
  it('is upcoming before the first day', () => {
    expect(eventState(new Date('2026-10-12T12:00:00Z'), event)).toBe('upcoming');
  });

  it('is live from the start of the first day to the end of the last, in the event time zone', () => {
    // 23:30 UTC on the 12th is 02:30 on the 13th in Kyiv.
    expect(eventState(new Date('2026-10-12T23:30:00Z'), event)).toBe('live');
    expect(eventState(new Date('2026-10-14T20:00:00Z'), event)).toBe('live');
  });

  it('is over after the last day', () => {
    // 21:30 UTC on the 14th is 00:30 on the 15th in Kyiv.
    expect(eventState(new Date('2026-10-14T21:30:00Z'), event)).toBe('over');
  });
});

describe('daysUntilStart', () => {
  it('counts calendar days in the event time zone', () => {
    expect(daysUntilStart(new Date('2026-10-01T12:00:00Z'), event)).toBe(12);
    // 21:30 UTC on the 11th is 00:30 on the 12th in Kyiv.
    expect(daysUntilStart(new Date('2026-10-11T21:30:00Z'), event)).toBe(1);
  });

  it('is 0 or less once the event started', () => {
    expect(daysUntilStart(new Date('2026-10-13T12:00:00Z'), event)).toBe(0);
    expect(daysUntilStart(new Date('2026-10-20T12:00:00Z'), event)).toBe(-7);
  });
});
