import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import schema from '../../../storage/schemas/content.schema.json';

// Firestore collection paths, with document IDs replaced by `*`, mapped to their schema definition.
const COLLECTIONS: Record<string, string> = {
  blog: 'post',
  gallery: 'photo',
  partners: 'partnerGroupDocument',
  'partners/*/items': 'partner',
  previousSpeakers: 'previousSpeaker',
  schedule: 'day',
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
