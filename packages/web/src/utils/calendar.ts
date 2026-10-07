import type { Session } from '../models/session';
import { location, timezoneOffset, title } from '../config/site';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}

const ONE_MINUTE_MS = 60 * 1000;

// `day` is YYYY-MM-DD and times are HH:MM in the event timezone, whose offset follows `Date.getTimezoneOffset()` sign rules.
const toDate = (day: string, time: string): Date => {
  const [year, month, date] = day.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const local = Date.UTC(year!, month! - 1, date!, hours!, minutes!);
  return new Date(local + parseInt(timezoneOffset) * ONE_MINUTE_MS);
};

export const sessionToCalendarEvent = (
  session: Session & { endTime?: string },
  url: string,
): CalendarEvent | undefined => {
  if (!session.day || !session.startTime || !session.endTime) {
    return undefined;
  }

  return {
    title: session.title,
    description: `${session.description}\n\n${url}`,
    location: `${location.name}, ${location.address}`,
    start: toDate(session.day, session.startTime),
    end: toDate(session.day, session.endTime),
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
