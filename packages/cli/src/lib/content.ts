import { readFileSync } from 'fs';
import { join } from 'path';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import schema from '../../../storage/schemas/content.schema.json';
import { scheduleErrors, type Track } from '../../../web/src/schedule/build-schedule.js';
import type { Session } from '../../../web/src/models/session.js';

// Firestore collection paths, with document IDs replaced by `*`, mapped to their schema definition.
const COLLECTIONS: Record<string, string> = {
  blog: 'post',
  gallery: 'photo',
  partners: 'partnerGroupDocument',
  'partners/*/items': 'partner',
  previousSpeakers: 'previousSpeaker',
  sessions: 'session',
  speakers: 'speaker',
  team: 'teamDocument',
  'team/*/members': 'member',
  tickets: 'ticket',
  videos: 'video',
};

const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
ajv.addSchema(schema);

const validator = (ref: string): ValidateFunction => {
  const validate = ajv.getSchema(`${schema.$id}${ref}`);
  if (!validate) {
    throw new Error(`Missing content schema ${ref}`);
  }
  return validate;
};

const assertValid = (validate: ValidateFunction, data: unknown, label: string) => {
  if (!validate(data)) {
    throw new Error(`Invalid ${label}: ${ajv.errorsText(validate.errors, { dataVar: label })}`);
  }
};

const collectionPattern = (collectionPath: string) =>
  collectionPath
    .split('/')
    .map((segment, index) => (index % 2 === 0 ? segment : '*'))
    .join('/');

/** Throws when `data` is not a valid document for a content collection. Other collections pass. */
export const validateContent = (collectionPath: string, documentId: string, data: unknown) => {
  const definition = COLLECTIONS[collectionPattern(collectionPath)];
  if (definition) {
    assertValid(validator(`#/$defs/${definition}`), data, `${collectionPath}/${documentId}`);
  }
};

/** Throws when the seed file does not match the content schema. */
export const validateSeedData = (data: unknown) => {
  assertValid(validator(''), data, 'seed data');
};

const SITE_PATH = join(import.meta.dirname, '..', '..', '..', 'config', 'site.json');

/** `schedule.tracks` in packages/config/site.json. */
export const siteTracks = (path = SITE_PATH): Track[] =>
  (JSON.parse(readFileSync(path, 'utf8')) as { schedule?: { tracks?: Track[] } }).schedule
    ?.tracks ?? [];

/**
 * Throws when sessions are not on the schedule as they say: a track that isn't in site.json or not
 * on the session's day, an end that isn't after the start, or two sessions at once in one track.
 */
export const validateSchedule = (
  sessions: Record<string, unknown>,
  tracks: Track[] = siteTracks(),
) => {
  const errors = scheduleErrors(
    Object.entries(sessions).map(([id, session]) => ({ ...(session as Session), id })),
    tracks,
  );
  if (errors.length) {
    throw new Error(`Invalid schedule:\n${errors.map((error) => `  ${error}`).join('\n')}`);
  }
};
