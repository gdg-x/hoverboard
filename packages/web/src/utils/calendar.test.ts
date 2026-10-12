import { afterEach, describe, expect, it, vi } from 'vitest';
import { description, eventDates, location as actualLocation, title, url } from '../config/site';
import type { Session } from '../models/session';
import {
  eventToCalendarEvent,
  googleCalendarUrl,
  icsCalendar,
  icsContent,
  sessionToCalendarEvent,
} from './calendar';

const config = vi.hoisted(() => ({
  attendance: 'inPerson' as 'inPerson' | 'online' | 'hybrid',
  stream: undefined as string | undefined,
}));

vi.mock('../config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/site')>();
  return {
    ...actual,
    timeZone: 'Europe/Kyiv',
    get attendance() {
      return config.attendance;
    },
    get stream() {
      return config.stream;
    },
    get location() {
      return config.attendance === 'online' ? undefined : actual.location;
    },
  };
});

const session: Session & { endTime: string } = {
  id: 'session-1',
  title: 'A talk, with; punctuation',
  description: 'Line one\nLine two',
  day: '2024-01-02',
  startTime: '10:00',
  endTime: '10:45',
};

describe('calendar', () => {
  afterEach(() => {
    config.attendance = 'inPerson';
    config.stream = undefined;
  });

  it('places a session at the venue in person', () => {
    config.stream = 'https://stream.example/live';
    const event = sessionToCalendarEvent(session, 'https://x')!;

    expect(event.location).toBe('Planeta kino, 36 Shchyretska St, Lviv, Ukraine');
    expect(event.description).toBe('Line one\nLine two\n\nhttps://x');
  });

  it("adds a session's own stream below the description in person", () => {
    const event = sessionToCalendarEvent(
      { ...session, stream: 'https://stream.example/talk' },
      'https://x',
    )!;

    expect(event.location).toBe('Planeta kino, 36 Shchyretska St, Lviv, Ukraine');
    expect(event.description).toBe(
      'Line one\nLine two\n\nhttps://x\n\nWatch online: https://stream.example/talk',
    );
  });

  it('places a session at the stream online', () => {
    config.attendance = 'online';
    config.stream = 'https://stream.example/live';

    expect(sessionToCalendarEvent(session, 'https://x')!.location).toBe(
      'https://stream.example/live',
    );
  });

  it('places a hybrid session at the venue, with the stream in the description', () => {
    config.attendance = 'hybrid';
    config.stream = 'https://stream.example/live';
    const event = sessionToCalendarEvent(session, 'https://x')!;

    expect(event.location).toBe('Planeta kino, 36 Shchyretska St, Lviv, Ukraine');
    expect(event.description).toBe(
      'Line one\nLine two\n\nhttps://x\n\nWatch online: https://stream.example/live',
    );
  });
  it('returns undefined when the session has no schedule times', () => {
    const { day: _day, ...withoutDay } = session;

    expect(sessionToCalendarEvent(withoutDay, 'https://x')).toBeUndefined();
  });

  it('converts times in the event time zone to UTC', () => {
    const event = sessionToCalendarEvent(session, 'https://x')!;

    expect(event.start.toISOString()).toBe('2024-01-02T08:00:00.000Z');
    expect(event.end.toISOString()).toBe('2024-01-02T08:45:00.000Z');
  });

  it('builds a Google Calendar url', () => {
    const url = new URL(googleCalendarUrl(sessionToCalendarEvent(session, 'https://x')!));

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(session.title);
    expect(url.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });

  it('builds an escaped ics file', () => {
    const ics = icsContent(sessionToCalendarEvent(session, 'https://x')!, 'session-1');

    expect(ics).toContain('SUMMARY:A talk\\, with\\; punctuation');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
    expect(ics).toContain('UID:session-1');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  });

  it('builds one ics file with several events', () => {
    const other = { ...session, title: 'Another talk', startTime: '11:00', endTime: '11:30' };
    const ics = icsCalendar([
      [sessionToCalendarEvent(session, 'https://x')!, 'session-1'],
      [sessionToCalendarEvent(other, 'https://y')!, 'session-2'],
    ]);

    expect(ics.match(/BEGIN:VCALENDAR/g)).toHaveLength(1);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:session-2');
    expect(ics).toContain('DTSTART:20240102T090000Z');
  });

  describe('the whole event', () => {
    const venue = { attendance: 'inPerson', location: actualLocation } as const;

    it('is on its days, all day, at the venue', () => {
      const event = eventToCalendarEvent(venue);

      expect(event).toMatchObject({
        title,
        location: 'Planeta kino, 36 Shchyretska St, Lviv, Ukraine',
        allDay: true,
      });
      expect(event.description).toBe(`${description}\n\n${url}`);
      expect(event.start.toISOString().slice(0, 10)).toBe(eventDates.start);
      expect(event.end.toISOString().slice(0, 10)).toBe(dayAfter(eventDates.end));
    });

    it('is at the stream online, and at the venue with the stream in the description when hybrid', () => {
      config.stream = 'https://stream.example/live';

      expect(eventToCalendarEvent({ attendance: 'online', location: undefined }).location).toBe(
        'https://stream.example/live',
      );
      const hybrid = eventToCalendarEvent({ ...venue, attendance: 'hybrid' });
      expect(hybrid.location).toBe('Planeta kino, 36 Shchyretska St, Lviv, Ukraine');
      expect(hybrid.description).toContain('Watch online: https://stream.example/live');
    });

    it('writes whole days for calendars, with the day after the last', () => {
      const event = eventToCalendarEvent(venue);
      const days = `${eventDates.start.replaceAll('-', '')}/${dayAfter(eventDates.end).replaceAll('-', '')}`;

      expect(new URL(googleCalendarUrl(event)).searchParams.get('dates')).toBe(days);
      const ics = icsContent(event, 'event');
      expect(ics).toContain(`DTSTART;VALUE=DATE:${eventDates.start.replaceAll('-', '')}`);
      expect(ics).toContain(`DTEND;VALUE=DATE:${dayAfter(eventDates.end).replaceAll('-', '')}`);
    });
  });
});

const dayAfter = (day: string) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};
