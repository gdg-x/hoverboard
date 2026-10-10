import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isLive, LIVE_EARLY_MS, sessionStream } from './stream';

const config = vi.hoisted(() => ({
  attendance: 'online' as 'inPerson' | 'online' | 'hybrid',
}));

vi.mock('../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../config/site')>()),
  timeZone: 'Europe/Kyiv',
  stream: 'https://stream.example/event',
  scheduleTracks: [
    { id: 'main', title: 'Main', stream: 'https://stream.example/main' },
    { id: 'side', title: 'Side' },
  ],
  get attendance() {
    return config.attendance;
  },
}));

describe('sessionStream', () => {
  afterEach(() => {
    config.attendance = 'online';
  });

  it("uses the session's link, then its track's, then the event's", () => {
    expect(sessionStream({ stream: 'https://stream.example/own', track: 'main' })).toBe(
      'https://stream.example/own',
    );
    expect(sessionStream({ track: 'main' })).toBe('https://stream.example/main');
    expect(sessionStream({ track: { id: 'main' } })).toBe('https://stream.example/main');
    expect(sessionStream({ track: 'side' })).toBe('https://stream.example/event');
    expect(sessionStream({})).toBe('https://stream.example/event');
  });

  it("leaves out the event's link in person, but not a session's or a track's", () => {
    config.attendance = 'inPerson';

    expect(sessionStream({})).toBeUndefined();
    expect(sessionStream({ track: 'main' })).toBe('https://stream.example/main');
    expect(sessionStream({ stream: 'https://stream.example/own' })).toBe(
      'https://stream.example/own',
    );
  });

  it('ignores a link that is not https', () => {
    config.attendance = 'inPerson';

    expect(sessionStream({ stream: 'javascript:alert(1)' })).toBeUndefined();
    expect(sessionStream({ stream: 'http://stream.example/own' })).toBeUndefined();
  });
});

describe('isLive', () => {
  // 10:00 to 10:45 in Kyiv is 08:00 to 08:45 UTC.
  const session = { day: '2024-01-02', startTime: '10:00', endTime: '10:45' };
  const at = (iso: string, offset = 0) => vi.setSystemTime(new Date(iso).getTime() + offset);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is on from shortly before the start until the end, in the event time zone', () => {
    at('2024-01-02T08:00:00Z', -LIVE_EARLY_MS - 1);
    expect(isLive(session)).toBe(false);
    at('2024-01-02T08:00:00Z', -LIVE_EARLY_MS);
    expect(isLive(session)).toBe(true);
    at('2024-01-02T08:44:59Z');
    expect(isLive(session)).toBe(true);
    at('2024-01-02T08:45:00Z');
    expect(isLive(session)).toBe(false);
  });

  it('is never on without a day and times', () => {
    at('2024-01-02T08:10:00Z');

    expect(isLive({ day: '2024-01-02', startTime: '10:00' })).toBe(false);
    expect(isLive({})).toBe(false);
  });
});
