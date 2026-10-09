import type { Session } from '../models/session';
import { timeZone } from '../config/site';
import { zonedTime } from './time-zone';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const acceptingFeedback = ({
  day,
  startTime,
}: Pick<Session, 'day' | 'startTime'>): boolean => {
  if (!day || !startTime) return false;
  const diff = Date.now() - zonedTime(day, startTime, timeZone).getTime();

  return diff > 0 && diff < ONE_WEEK_MS;
};
