export interface TimeWindow {
  before: Date;
  after: Date;
}

// The wall clock in `timeZone` at `date`, as numbers.
const wallClockParts = (timeZone: string, date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
    second: part('second'),
  };
};

// Minutes that the clocks in `timeZone` are ahead of UTC at `date`.
const offsetMinutes = (timeZone: string, date: Date): number => {
  const { year, month, day, hour, minute, second } = wallClockParts(timeZone, date);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((wallClock - date.getTime()) / 60000);
};

/**
 * Get today's date formatted as YYYY-MM-DD in the specified IANA time zone
 */
export function getTodayDateString(timeZone: string): string {
  const { year, month, day } = wallClockParts(timeZone, new Date());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Create a time window around the current time with specified minutes before and after
 */
export function createTimeWindow(minutesBefore: number, minutesAfter: number): TimeWindow {
  const now = new Date();
  return {
    before: new Date(now.getTime() - minutesBefore * 60000),
    after: new Date(now.getTime() + minutesAfter * 60000),
  };
}

/**
 * Parse a "HH:mm" time string as today's date in the specified IANA time zone, returning the
 * equivalent UTC instant.
 */
function parseTimeInTimezone(timeString: string, timeZone: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const [year, month, day] = getTodayDateString(timeZone).split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);
  // The second pass uses the offset at the result, which differs near daylight saving changes.
  const guess = wallClock - offsetMinutes(timeZone, new Date(wallClock)) * 60000;
  return new Date(wallClock - offsetMinutes(timeZone, new Date(guess)) * 60000);
}

/**
 * Parse a time string with timezone and subtract specified minutes
 */
export function parseTimeAndSubtract(
  timeString: string,
  timezone: string,
  minutesToSubtract: number,
): Date {
  const parsedTime = parseTimeInTimezone(timeString, timezone);
  return new Date(parsedTime.getTime() - minutesToSubtract * 60000);
}

/**
 * Check if a given date is between two other dates
 */
export function isBetween(target: Date, start: Date, end: Date): boolean {
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
}

/**
 * Get relative time string from a date
 */
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes === 0) return 'now';

  const absDiffMinutes = Math.abs(diffMinutes);
  const isFuture = diffMinutes > 0;

  if (absDiffMinutes < 60) {
    return isFuture ? `in ${absDiffMinutes} minutes` : `${absDiffMinutes} minutes ago`;
  }

  const hours = Math.round(absDiffMinutes / 60);
  if (hours < 24) {
    return isFuture ? `in ${hours} hours` : `${hours} hours ago`;
  }

  const days = Math.round(hours / 24);
  return isFuture ? `in ${days} days` : `${days} days ago`;
}

/**
 * Parse a time string with timezone and get the relative time from now
 */
export function parseTimeAndGetFromNow(timeString: string, timezone: string): string {
  return getRelativeTimeString(parseTimeInTimezone(timeString, timezone));
}

/**
 * Filter timeslots that fall within a time window, accounting for a notification offset
 */
export function filterUpcomingTimeslots<T extends { startTime: string; sessions?: any[] }>(
  timeslots: T[],
  timeWindow: TimeWindow,
  notificationOffsetMinutes: number,
  timezone: string,
): T[] {
  return timeslots.filter((timeslot) => {
    const timeslotTime = parseTimeAndSubtract(
      timeslot.startTime,
      timezone,
      notificationOffsetMinutes,
    );
    return isBetween(timeslotTime, timeWindow.before, timeWindow.after);
  });
}
