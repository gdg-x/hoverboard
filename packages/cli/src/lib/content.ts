import { readFileSync } from 'fs';
import { join } from 'path';
import type { ValidateFunction } from 'ajv/dist/2020.js';
import { collectionInfo } from '../../../storage/collections.js';
import { documentProblems } from '../../../storage/messages.js';
import { schemaValidator as validator } from '../../../storage/validate.js';
import { scheduleErrors, type Track } from '../../../web/src/schedule/build-schedule.js';
import type { Session } from '../../../web/src/models/session.js';

export { documentMessages } from '../../../storage/validate.js';

const assertValid = (validate: ValidateFunction, data: unknown, label: string) => {
  if (!validate(data)) {
    throw new Error(documentProblems(label, validate.errors).join('\n'));
  }
};

/** Throws when `data` is not a valid document for a content collection. Other collections pass. */
export const validateContent = (collectionPath: string, documentId: string, data: unknown) => {
  const info = collectionInfo(collectionPath);
  if (info?.kind === 'content') {
    assertValid(validator(`#/$defs/${info.schema}`), data, `${collectionPath}/${documentId}`);
  }
};

/** Throws when the seed file does not match the Firestore schema. */
export const validateSeedData = (data: unknown) => {
  assertValid(validator(''), data, 'docs/default-firebase-data.json');
};

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

/** Throws the {@link scheduleMessages} of the sessions. */
export const validateSchedule = (
  sessions: Record<string, unknown>,
  tracks: Track[] = siteTracks(),
) => {
  const errors = scheduleMessages(sessions, tracks);
  if (errors.length) {
    throw new Error(`Invalid schedule:\n${errors.map((error) => `  ${error}`).join('\n')}`);
  }
};
