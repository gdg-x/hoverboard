import { msg, str } from '@lit/localize';
import type { Session } from '../models/session';
import {
  description,
  eventDates,
  location,
  stream,
  timeZone,
  title,
  url as siteUrl,
} from '../config/site';
import type { Attending } from './place';
import { sessionStream } from './stream';
import { zonedTime } from './time-zone';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  /** Whole days: `start` is the first day, and `end` the day after the last, at UTC midnight. */
  allDay?: boolean;
}

/** The place of an event, and the stream link for its description when the place is the venue. */
const place = (venue: Attending['location'], link: string | undefined) => ({
  location: venue ? `${venue.name}, ${venue.address}` : (link ?? ''),
  watch:
    venue && link ? `\n\n${msg(str`Watch online: ${link}`, { id: 'calendar.watch-online' })}` : '',
});

/** The whole event, on its days, at the venue or online. Pass where people attend from the page. */
export const eventToCalendarEvent = ({ attendance, location: venue }: Attending): CalendarEvent => {
  const { location: where, watch } = place(venue, attendance === 'inPerson' ? undefined : stream);
  const end = new Date(`${eventDates.end}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    title,
    description: `${description}\n\n${siteUrl}${watch}`,
    location: where,
    start: new Date(`${eventDates.start}T00:00:00Z`),
    end,
    allDay: true,
  };
};

export const sessionToCalendarEvent = (
  session: Pick<Session, 'title' | 'description' | 'day' | 'startTime' | 'stream'> & {
    endTime?: string | undefined;
    track?: string | { id: string } | undefined;
  },
  url: string,
): CalendarEvent | undefined => {
  if (!session.day || !session.startTime || !session.endTime) {
    return undefined;
  }

  // Without a venue, the stream is the place. With one, the stream goes below the description.
  const { location: where, watch } = place(location, sessionStream(session));

  return {
    title: session.title,
    description: `${session.description}\n\n${url}${watch}`,
    location: where,
    start: zonedTime(session.day, session.startTime, timeZone),
    end: zonedTime(session.day, session.endTime, timeZone),
  };
};

const formatUtc = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
const formatDay = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '');

export const googleCalendarUrl = (event: CalendarEvent): string => {
  const format = event.allDay ? formatDay : formatUtc;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${format(event.start)}/${format(event.end)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

const vevent = (event: CalendarEvent, uid: string, stamp: string) => [
  'BEGIN:VEVENT',
  `UID:${uid}`,
  `DTSTAMP:${stamp}`,
  ...(event.allDay
    ? [`DTSTART;VALUE=DATE:${formatDay(event.start)}`, `DTEND;VALUE=DATE:${formatDay(event.end)}`]
    : [`DTSTART:${formatUtc(event.start)}`, `DTEND:${formatUtc(event.end)}`]),
  `SUMMARY:${escapeText(event.title)}`,
  `DESCRIPTION:${escapeText(event.description)}`,
  `LOCATION:${escapeText(event.location)}`,
  'END:VEVENT',
];

/** An `.ics` calendar with each event, by its unique ID. */
export const icsCalendar = (events: readonly [CalendarEvent, string][]): string => {
  const stamp = formatUtc(new Date());
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${escapeText(title)}//Hoverboard//EN`,
    'CALSCALE:GREGORIAN',
    ...events.flatMap(([event, uid]) => vevent(event, uid, stamp)),
    'END:VCALENDAR',
  ].join('\r\n');
};

export const icsContent = (event: CalendarEvent, uid: string): string =>
  icsCalendar([[event, uid]]);

/** Downloads `<fileName>.ics` with each event, by its unique ID. */
export const downloadIcs = (events: readonly [CalendarEvent, string][], fileName: string) => {
  const blob = new Blob([icsCalendar(events)], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${fileName}.ics`;
  link.click();
  URL.revokeObjectURL(href);
};
