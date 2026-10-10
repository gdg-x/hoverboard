import { msg, str } from '@lit/localize';
import type { Session } from '../models/session';
import { attendance, location, stream, timeZone, title } from '../config/site';
import { zonedTime } from './time-zone';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

export const sessionToCalendarEvent = (
  session: Session & { endTime?: string },
  url: string,
): CalendarEvent | undefined => {
  if (!session.day || !session.startTime || !session.endTime) {
    return undefined;
  }

  // Online, the stream is the place. A hybrid event keeps the venue, and adds the stream below.
  const place = location ? `${location.name}, ${location.address}` : (stream ?? '');
  const watch =
    attendance === 'hybrid' && stream
      ? `\n\n${msg(str`Watch online: ${stream}`, { id: 'calendar.watch-online' })}`
      : '';

  return {
    title: session.title,
    description: `${session.description}\n\n${url}${watch}`,
    location: place,
    start: zonedTime(session.day, session.startTime, timeZone),
    end: zonedTime(session.day, session.endTime, timeZone),
  };
};

const formatUtc = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');

export const googleCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatUtc(event.start)}/${formatUtc(event.end)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

export const icsContent = (event: CalendarEvent, uid: string): string =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${escapeText(title)}//Hoverboard//EN`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(event.start)}`,
    `DTEND:${formatUtc(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

export const downloadIcs = (event: CalendarEvent, uid: string) => {
  const blob = new Blob([icsContent(event, uid)], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${uid}.ics`;
  link.click();
  URL.revokeObjectURL(href);
};
