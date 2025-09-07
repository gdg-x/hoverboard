export interface TimeWindow {
  before: Date;
  after: Date;
}

export interface TimeConfig {
  timezone?: string;
}

/**
 * Parse timezone offset string (e.g., "+02:00", "-05:00") to minutes
 */
function parseTimezoneOffset(timezone: string): number {
  if (!timezone) return 0;

  const match = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;

  const [, sign, hours, minutes] = match;
  const offsetMinutes = parseInt(hours) * 60 + parseInt(minutes);
  return sign === '+' ? offsetMinutes : -offsetMinutes;
}

/**
 * Get today's date formatted as YYYY-MM-DD in the specified timezone
 */
export function getTodayDateString(timezone?: string): string {
  const now = new Date();

  if (timezone) {
    const offsetMinutes = parseTimezoneOffset(timezone);
    const localTime = new Date(now.getTime() + offsetMinutes * 60000);
    return localTime.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
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
 * Parse a time string with timezone and subtract specified minutes
 */
export function parseTimeAndSubtract(
  timeString: string,
  timezone: string,
  minutesToSubtract: number,
): Date {
  // Parse time format HH:mm
  const [hours, minutes] = timeString.split(':').map(Number);

  // Get today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Create date with the parsed time in UTC
  const targetDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

  // Apply timezone offset (convert from specified timezone to UTC)
  const offsetMinutes = parseTimezoneOffset(timezone);
  const utcTime = targetDate.getTime() - offsetMinutes * 60000;

  // Subtract the specified minutes
  return new Date(utcTime - minutesToSubtract * 60000);
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
  // Parse time format HH:mm
  const [hours, minutes] = timeString.split(':').map(Number);

  // Get today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Create date with the parsed time in UTC
  const targetDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

  // Apply timezone offset (convert from specified timezone to UTC)
  const offsetMinutes = parseTimezoneOffset(timezone);
  const utcTime = targetDate.getTime() - offsetMinutes * 60000;
  const finalDate = new Date(utcTime);

  return getRelativeTimeString(finalDate);
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
