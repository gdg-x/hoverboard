import type { Session } from '../models/session';
import { timeZone } from '../config/site';
import { currentTime } from './clock';
import { zonedTime } from './time-zone';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Whether visitors can add reactions: any time before a session, and for a week after it ends. A
 * session without a day or a time is always open.
 */
export const acceptingReactions = ({
  day,
  startTime,
  endTime,
}: Pick<Session, 'day' | 'startTime' | 'endTime'>): boolean => {
  const end = endTime ?? startTime;
  if (!day || !end) return true;
  return currentTime() < zonedTime(day, end, timeZone).getTime() + ONE_WEEK_MS;
};
