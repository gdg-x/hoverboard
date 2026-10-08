export type EventState = 'upcoming' | 'live' | 'over';

export interface EventDates {
  /** `YYYY-MM-DD` in the event time zone. */
  startDate: string;
  endDate: string;
  timezone: string;
}

// `en-CA` formats dates as YYYY-MM-DD, which compare as strings.
const dateIn = (now: Date, timezone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);

/** Whether the event is still to come, on now or over, by the date in the event time zone. */
export const eventState = (now: Date, { startDate, endDate, timezone }: EventDates): EventState => {
  const today = dateIn(now, timezone);
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'over';
  return 'live';
};

/** Calendar days from today to the first day, in the event time zone. 0 or less once it started. */
export const daysUntilStart = (
  now: Date,
  { startDate, timezone }: Pick<EventDates, 'startDate' | 'timezone'>,
): number =>
  Math.round(
    (Date.parse(`${startDate}T00:00:00Z`) - Date.parse(`${dateIn(now, timezone)}T00:00:00Z`)) /
      86_400_000,
  );
