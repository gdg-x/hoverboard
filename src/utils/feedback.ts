import { Session } from '../models/session';
import { timezoneOffset } from './data';

const THREE_WEEK_MS = 20 * 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

export const acceptingFeedback = (session: Session): boolean => {
  const { day, startTime } = session;
  const now = new Date();
  const currentTime = new Date(`${day} ${startTime}`).getTime();
  const totalTimezoneOffset = parseInt(timezoneOffset) - now.getTimezoneOffset();
  const convertedTimezoneDate = new Date(currentTime + totalTimezoneOffset * ONE_MINUTE_MS);
  const diff = now.getTime() - convertedTimezoneDate.getTime();

  return diff > 0 && diff < THREE_WEEK_MS;
};
