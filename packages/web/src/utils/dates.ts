import { eventDates } from '../config/site';
import { getLocale } from './localization';

export const getDate = (date: string | Date) => {
  return new Date(date).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** The event's days in the current locale, for example `October 13 – 14, 2027`. */
export const getEventDates = ({ start, end } = eventDates) =>
  // The dates are calendar days with no time zone, so they are read and formatted as UTC.
  new Intl.DateTimeFormat(getLocale(), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`));
