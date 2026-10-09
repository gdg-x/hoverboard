import type { ErrorObject } from 'ajv/dist/2020.js';
import { RETIRED_FIELDS, collectionInfo } from '../../../storage/collections.js';
import { definitionOf, fieldPath } from '../../../storage/messages.js';
import { documentErrors } from '../../../storage/validate.js';

/** Removes a field. */
export const DELETE = Symbol('delete');
/** Sets a field to the time of the write. */
export const NOW = Symbol('now');

export interface FieldFix {
  /** The path to the field, as in Ajv's `instancePath` without the leading slash. Empty with `DELETE` deletes the document. */
  segments: string[];
  value: unknown;
  /** What changes, such as `badges[1].link " https://…" to "https://…"`. */
  description: string;
}

export interface FixOptions {
  /** The event time zone, to turn timestamps into dates. */
  timeZone: string;
}

const pointer = (instancePath: string) =>
  instancePath
    .split('/')
    .slice(1)
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));

const shown = (value: unknown) => (value === DELETE ? 'removed' : JSON.stringify(value));

const dateIn = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));

/** The safe fix for one of Ajv's errors, if it has one. */
export const fixFor = (error: ErrorObject, { timeZone }: FixOptions): FieldFix | undefined => {
  const segments = pointer(error.instancePath);
  const data: unknown = error.data;
  const params = error.params as Record<string, unknown>;
  const fix = (value: unknown, path = segments): FieldFix => ({
    segments: path,
    value,
    description: `${fieldPath(`/${path.join('/')}`)} ${shown(data)} to ${shown(value)}`,
  });

  if (error.keyword === 'pattern' && typeof data === 'string' && data.trim() !== data) {
    return fix(data.trim());
  }
  if (error.keyword === 'type') {
    const expected = String(params['type']).split(',');
    const json = (data ?? {}) as { $reference?: unknown; $timestamp?: unknown };
    if (expected.includes('string') && typeof json.$reference === 'string') {
      return fix(json.$reference.split('/').pop());
    }
    if (definitionOf(error) === 'date' && typeof json.$timestamp === 'string') {
      return fix(dateIn(json.$timestamp, timeZone));
    }
    if (
      expected.includes('number') &&
      typeof data === 'string' &&
      /^-?\d+(\.\d+)?$/.test(data.trim())
    ) {
      return fix(Number(data));
    }
  }
  if (error.keyword === 'additionalProperties') {
    const name = String(params['additionalProperty']);
    if (RETIRED_FIELDS[definitionOf(error) ?? '']?.[name]) {
      const path = [...segments, name];
      return {
        segments: path,
        value: DELETE,
        description: `${fieldPath(`/${path.join('/')}`)} removed`,
      };
    }
  }
  if (error.keyword === 'required' && params['missingProperty'] === 'updatedAt') {
    const path = [...segments, 'updatedAt'];
    return {
      segments: path,
      value: NOW,
      description: `${fieldPath(`/${path.join('/')}`)} set to the current time`,
    };
  }
  return undefined;
};

/** Sign-ups without a valid email can't be answered, so `--fix` deletes them. */
const NEED_EMAIL = new Set(['subscribers', 'potentialPartners']);

const emailError = (error: ErrorObject) =>
  error.instancePath === '/email' ||
  (error.keyword === 'required' &&
    (error.params as Record<string, unknown>)['missingProperty'] === 'email');

/**
 * The fix for an error of a document. Visitor data only gets fixes that add a missing time, drop
 * empty bookmarks or delete a sign-up without a valid email, never ones that change what a visitor wrote.
 */
const fixIn = (
  documentPath: string,
  error: ErrorObject,
  options: FixOptions,
): FieldFix | undefined => {
  const segments = documentPath.split('/');
  if (segments.length === 2 && NEED_EMAIL.has(segments[0]!) && emailError(error)) {
    return {
      segments: [],
      value: DELETE,
      description: 'deleted, since its email isn\u2019t valid',
    };
  }
  // Older sites wrote null for a removed bookmark. The site now removes the entry.
  if (segments[0] === 'featuredSessions' && error.keyword === 'type' && error.data === null) {
    return {
      segments: pointer(error.instancePath),
      value: DELETE,
      description: 'null entries removed',
    };
  }
  const fix = fixFor(error, options);
  return fix && (collectionInfo(documentPath)?.kind !== 'visitor' || fix.value === NOW)
    ? fix
    : undefined;
};

/** Whether `--fix` can fix an error of the document. */
export const fixable =
  (documentPath: string, options: FixOptions) =>
  (error: ErrorObject): boolean =>
    fixIn(documentPath, error, options) !== undefined;

/** The safe fixes for a document, from its JSON. Collections outside the registry get none. */
export const documentFixes = (
  documentPath: string,
  json: unknown,
  options: FixOptions,
): FieldFix[] => {
  if (!collectionInfo(documentPath)) return [];
  const fixes = documentErrors(documentPath, json).flatMap(
    (error) => fixIn(documentPath, error, options) ?? [],
  );
  const deleted = fixes.find(({ segments }) => !segments.length);
  if (deleted) return [deleted];
  // Ajv can report one field twice, such as a pattern in two branches.
  return [...new Map(fixes.map((fix) => [fix.segments.join('/'), fix])).values()];
};

const setIn = (value: unknown, [key, ...rest]: string[], next: unknown): unknown => {
  if (key === undefined) return next;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(key)] = setIn(copy[Number(key)], rest, next);
    return copy;
  }
  const copy = { ...(value as Record<string, unknown>) };
  const item = setIn(copy[key], rest, next);
  if (item === DELETE) delete copy[key];
  else copy[key] = item;
  return copy;
};

/**
 * The new values of the document's top-level fields that the fixes change, from its raw data, so
 * timestamps and references elsewhere in a field stay as they are. `DELETE` removes a field.
 */
export const fieldUpdates = (
  raw: Record<string, unknown>,
  fixes: FieldFix[],
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};
  for (const { segments, value } of fixes) {
    const [field, ...rest] = segments;
    if (field === undefined) continue;
    updates[field] = setIn(field in updates ? updates[field] : raw[field], rest, value);
  }
  return updates;
};
