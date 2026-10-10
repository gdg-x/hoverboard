import { eventDates, timeZone } from '../config/site';
import { type DemoTime, readDemoTime } from './demo';
import { zonedTime } from './time-zone';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The time the demo banner picks: two weeks before the first day, 11:00 on the first day, or two
 * weeks after the last, in the event time zone. Two weeks is past the windows for feedback and
 * reactions.
 */
export const demoTime = (when: DemoTime): number => {
  if (when === 'before')
    return zonedTime(eventDates.start, '10:00', timeZone).getTime() - 14 * DAY_MS;
  if (when === 'during') return zonedTime(eventDates.start, '11:00', timeZone).getTime();
  return zonedTime(eventDates.end, '12:00', timeZone).getTime() + 14 * DAY_MS;
};

// Only a demo site's browser moves the clock, so the server and other sites read the real time.
const picked = __HB_FEATURES__.demo && typeof window !== 'undefined' ? readDemoTime() : null;
const offset = picked ? demoTime(picked) - Date.now() : 0;

/** The current time in milliseconds, for what depends on the event's dates. It keeps ticking. */
export const currentTime = (): number => Date.now() + offset;
