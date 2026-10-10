import { msg, str } from '@lit/localize';
import { timeZone } from '../config/site';
import { wallClock, zonedTime } from './time-zone';

/** Whether the browser's time zone isn't the event's. Call it only in the browser. */
export const otherTimeZone = (): boolean =>
  Intl.DateTimeFormat().resolvedOptions().timeZone !== timeZone;

/** `day` at `time` in the event time zone, as the visitor's clocks show it. */
export const visitorClock = (day: string, time: string): { date: string; time: string } =>
  wallClock(zonedTime(day, time, timeZone));

/** Marks a time in the visitor's time zone, which they may not expect outside the schedule. */
export const yourTime = (time: string): string =>
  msg(str`${time} (your time)`, { id: 'common.your-time' });
