export type EventState = 'upcoming' | 'live' | 'over';

export interface EventDates {
  /** `YYYY-MM-DD` in the event time zone. */
  startDate: string;
  endDate: string;
  timezone: string;
}

/** Whether the event is still to come, on now or over, by the date in the event time zone. */
export const eventState = (now: Date, { startDate, endDate, timezone }: EventDates): EventState => {
  // `en-CA` formats dates as YYYY-MM-DD, which compare as strings.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'over';
  return 'live';
};
