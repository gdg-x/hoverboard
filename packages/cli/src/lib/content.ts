import { readFileSync } from 'fs';
import { join } from 'path';
import { scheduleErrors, type Track } from '../../../web/src/schedule/build-schedule.js';
import type { Session } from '../../../web/src/models/session.js';

export { documentMessages } from '../../../storage/validate.js';

const SITE_PATH = join(import.meta.dirname, '..', '..', '..', 'config', 'site.json');

/** `schedule.tracks` in packages/config/site.json. */
export const siteTracks = (path = SITE_PATH): Track[] =>
  (JSON.parse(readFileSync(path, 'utf8')) as { schedule?: { tracks?: Track[] } }).schedule
    ?.tracks ?? [];

/** `event.timezone` in packages/config/site.json. */
export const siteTimeZone = (path = SITE_PATH): string =>
  (JSON.parse(readFileSync(path, 'utf8')) as { event?: { timezone?: string } }).event?.timezone ??
  'UTC';

/**
 * Sessions that are not on the schedule as they say: a track that isn't in site.json or not on the
 * session's day, an end that isn't after the start, or two sessions at once in one track.
 */
export const scheduleMessages = (
  sessions: Record<string, unknown>,
  tracks: Track[] = siteTracks(),
): string[] =>
  scheduleErrors(
    Object.entries(sessions).map(([id, session]) => ({ ...(session as Session), id })),
    tracks,
  );
