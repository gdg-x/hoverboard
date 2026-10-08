const ONE_MINUTE_MS = 60 * 1000;

// Minutes that the clocks in `timeZone` are ahead of UTC at `date`.
const offsetMinutes = (timeZone: string, date: Date): number => {
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
  const wallClock = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return Math.round((wallClock - date.getTime()) / ONE_MINUTE_MS);
};

/** The instant when the clocks in `timeZone` show `day` (YYYY-MM-DD) at `time` (HH:MM). */
export const zonedTime = (day: string, time: string, timeZone: string): Date => {
  const [year, month, date] = day.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const wallClock = Date.UTC(year!, month! - 1, date!, hours!, minutes!);
  // The second pass uses the offset at the result, which differs near daylight saving changes.
  const guess = wallClock - offsetMinutes(timeZone, new Date(wallClock)) * ONE_MINUTE_MS;
  return new Date(wallClock - offsetMinutes(timeZone, new Date(guess)) * ONE_MINUTE_MS);
};

/**
 * The date (YYYY-MM-DD) and time (HH:MM) the clocks show at `instant`, in `timeZone` or, without
 * one, in the browser's time zone.
 */
export const wallClock = (instant: Date, timeZone?: string): { date: string; time: string } => {
  // `en-CA` writes dates as YYYY-MM-DD.
  const date = new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant);
  return { date, time };
};
