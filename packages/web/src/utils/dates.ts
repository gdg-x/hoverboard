import { eventDates, timeZone } from '../config/site';
import { getLocale } from './localization';
import { wallClock } from './time-zone';

/**
 * Whether `time` falls on `from` (YYYY-MM-DD), on `until`, or a day between them, in the event's
 * time zone. Without `from` or `until`, the window has no start or end.
 */
export const onDates = (
  time: number,
  { from, until }: { from?: string | undefined; until?: string | undefined },
): boolean => {
  const today = wallClock(new Date(time), timeZone).date;
  return (!from || today >= from) && (!until || today <= until);
};

/** Whether the event's last day has passed at `time`, in the event's time zone. */
export const eventIsOver = (time: number): boolean => !onDates(time, { until: eventDates.end });

export const getDate = (date: string | Date) => {
  // `YYYY-MM-DD` is a calendar day that JavaScript reads as UTC midnight, so show it in UTC too.
  const day = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return new Date(date).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(day && { timeZone: 'UTC' }),
  });
};

/** A `YYYY-MM-DD` day of the schedule in the current locale, for example `October 13`. */
export const getScheduleDay = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** The event's days in the current locale, for example `October 13 – 14, 2027`. */
export const getEventDates = ({ start, end } = eventDates) =>
  // The dates are calendar days with no time zone, so they are read and formatted as UTC.
  new Intl.DateTimeFormat(getLocale(), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`));
