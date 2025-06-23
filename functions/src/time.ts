import moment from 'moment';

export interface TimeWindow {
  before: moment.Moment;
  after: moment.Moment;
}

export interface TimeConfig {
  timezone?: string;
}

/**
 * Get today's date formatted as YYYY-MM-DD in the specified timezone
 */
export function getTodayDateString(timezone?: string): string {
  return timezone
    ? moment().utcOffset(timezone).format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD');
}

/**
 * Create a time window around the current time with specified minutes before and after
 */
export function createTimeWindow(minutesBefore: number, minutesAfter: number): TimeWindow {
  return {
    before: moment().subtract(minutesBefore, 'minutes'),
    after: moment().add(minutesAfter, 'minutes'),
  };
}

/**
 * Parse a time string with timezone and subtract specified minutes
 */
export function parseTimeAndSubtract(
  timeString: string,
  timezone: string,
  format: string,
  minutesToSubtract: number,
): moment.Moment {
  // Use today's date to ensure we're parsing the time for the current day
  const today = moment().format('YYYY-MM-DD');
  return moment(`${today} ${timeString}${timezone}`, `YYYY-MM-DD ${format}Z`).subtract(
    minutesToSubtract,
    'minutes',
  );
}

/**
 * Check if a given moment is between two other moments
 */
export function isMomentBetween(
  target: moment.Moment,
  start: moment.Moment,
  end: moment.Moment,
): boolean {
  return target.isBetween(start, end);
}

/**
 * Parse a time string with timezone and get the relative time from now
 */
export function parseTimeAndGetFromNow(
  timeString: string,
  timezone: string,
  format: string,
): string {
  // Use today's date to ensure we're parsing the time for the current day
  const today = moment().format('YYYY-MM-DD');
  return moment(`${today} ${timeString}${timezone}`, `YYYY-MM-DD ${format}Z`).fromNow();
}

/**
 * Filter timeslots that fall within a time window, accounting for a notification offset
 */
export function filterUpcomingTimeslots<T extends { startTime: string; sessions?: any[] }>(
  timeslots: T[],
  timeWindow: TimeWindow,
  notificationOffsetMinutes: number,
  timezone: string,
  format: string,
): T[] {
  return timeslots.filter((timeslot) => {
    const timeslotTime = parseTimeAndSubtract(
      timeslot.startTime,
      timezone,
      format,
      notificationOffsetMinutes,
    );
    return isMomentBetween(timeslotTime, timeWindow.before, timeWindow.after);
  });
}
