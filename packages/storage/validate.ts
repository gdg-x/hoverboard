import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import { collectionInfo } from './collections';
import { documentProblems, type MessageOptions } from './messages';
import schema from './schemas/firestore.schema.json';

// `verbose` gives each error the data and the schema, which the messages read.
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, verbose: true });
ajv.addSchema(schema);

/** The validator of a part of firestore.schema.json, such as `#/$defs/session`, or the root for ''. */
export const schemaValidator = (ref: string): ValidateFunction => {
  const validate = ajv.getSchema(`${schema.$id}${ref}`);
  if (!validate) {
    throw new Error(`Missing Firestore schema ${ref}`);
  }
  return validate;
};

/**
 * The data with timestamps and references as the schema writes them in JSON. Works with the Admin
 * and the web SDK, which have their own classes.
 */
export const toJson = (value: unknown): unknown => {
  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      return { $timestamp: (value.toDate() as Date).toISOString() };
    }
    if ('path' in value && 'firestore' in value && typeof value.path === 'string') {
      return { $reference: value.path };
    }
    if (Array.isArray(value)) return value.map(toJson);
    if (Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJson(item)]));
    }
  }
  return value;
};

/** Ajv's errors for a document of any collection in the registry. `data` is JSON, as from {@link toJson}. */
export const documentErrors = (documentPath: string, data: unknown): ErrorObject[] => {
  const info = collectionInfo(documentPath);
  if (!info) return [];
  const validate = schemaValidator(`#/$defs/${info.schema}`);
  if (validate(data)) return [];
  // Paths in the definition itself start at `#/`. Name it, as for errors in other definitions.
  return (validate.errors ?? []).map((error) =>
    error.schemaPath.includes('$defs/')
      ? error
      : { ...error, schemaPath: error.schemaPath.replace('#/', `#/$defs/${info.schema}/`) },
  );
};

/**
 * The problems with a document of any collection in the registry, with values left out of visitor
 * data. A document Hoverboard doesn't use has none. `data` is JSON, as from {@link toJson}.
 */
export const documentMessages = (
  documentPath: string,
  data: unknown,
  options: Pick<MessageOptions, 'url' | 'fixable'> = {},
): string[] =>
  documentProblems(documentPath, documentErrors(documentPath, data), {
    ...options,
    hideValues: collectionInfo(documentPath)?.kind === 'visitor',
  });
