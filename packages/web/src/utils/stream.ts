import type { Session } from '../models/session';
import { attendance, scheduleTracks, stream, timeZone } from '../config/site';
import { currentTime } from './clock';
import { zonedTime } from './time-zone';

/** How long before a session starts its live link shows. */
export const LIVE_EARLY_MS = 10 * 60 * 1000;

const HTTPS = /^https:\/\/[^\s]+$/;

/**
 * The link to watch a session: its own `stream`, then its track's, then `event.stream` for an
 * online or hybrid event. Only `https:` links, since content isn't checked as it's edited.
 */
export const sessionStream = ({
  stream: own,
  track,
}: Pick<Session, 'stream'> & { track?: string | { id: string } | undefined }):
  string | undefined => {
  const trackId = typeof track === 'string' ? track : track?.id;
  const link =
    own ??
    scheduleTracks.find(({ id }) => id === trackId)?.stream ??
    (attendance === 'inPerson' ? undefined : stream);
  return link && HTTPS.test(link) ? link : undefined;
};

/** Whether a session is on: from `LIVE_EARLY_MS` before it starts until it ends. */
export const isLive = (
  { day, startTime, endTime }: Pick<Session, 'day' | 'startTime' | 'endTime'>,
  now = currentTime(),
): boolean => {
  if (!day || !startTime || !endTime) return false;
  return (
    now >= zonedTime(day, startTime, timeZone).getTime() - LIVE_EARLY_MS &&
    now < zonedTime(day, endTime, timeZone).getTime()
  );
};
