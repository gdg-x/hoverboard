import type { ErrorObject } from 'ajv';

export interface MessageOptions {
  /** Leaves values, map keys and references out, for documents with personal data. */
  hideValues?: boolean;
  /** Ends each message with a link to the document. */
  url?: string;
}

const MAX_VALUE_LENGTH = 60;

/** Firestore's names for value types, as the console shows them. */
const TYPE_NAMES: Record<string, string> = {
  array: 'an array',
  boolean: 'a boolean',
  integer: 'a whole number',
  null: 'null',
  number: 'a number',
  object: 'a map',
  string: 'a string',
};

/** What each `$defs` pattern means, by definition name. */
const PATTERNS: Record<string, string> = {
  date: 'must be a date, YYYY-MM-DD',
  email: 'must be an email address',
  link: 'must start with https://, http://, mailto: or /, with no spaces or line breaks around it',
  time: 'must be a time, HH:MM',
  timestamp: 'must be a time in ISO 8601',
};

const unescapePointer = (segment: string) => segment.replaceAll('~1', '/').replaceAll('~0', '~');

/** `badges[1].link` for Ajv's `/badges/1/link`. */
export const fieldPath = (instancePath: string): string =>
  instancePath
    .split('/')
    .slice(1)
    .map(unescapePointer)
    .reduce(
      (path, segment) =>
        /^\d+$/.test(segment) ? `${path}[${segment}]` : path ? `${path}.${segment}` : segment,
      '',
    );

const join = (field: string, name: string) => (field ? `${field}.${name}` : name);

/**
 * The field path with the keys of maps and the indexes of arrays as `*`, since in visitor data
 * keys can be push tokens or user IDs. A key at the top is "An entry".
 */
const maskedPath = (instancePath: string): string => {
  const path = instancePath
    .split('/')
    .slice(1)
    .map((segment, index) =>
      index === 0 && !/^\d+$/.test(segment) ? unescapePointer(segment) : '*',
    )
    .join('.');
  return path === '*' ? 'An entry' : path;
};

const kindOf = (value: unknown, hideValues = false): string => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('$reference' in value) {
      return hideValues ? 'a reference' : `a reference to ${String(value.$reference)}`;
    }
    if ('$timestamp' in value) return 'a timestamp';
  }
  if (value === null) return 'null';
  if (Array.isArray(value)) return TYPE_NAMES['array']!;
  return TYPE_NAMES[typeof value === 'object' ? 'object' : typeof value] ?? typeof value;
};

const shown = (value: unknown): string => {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…` : text;
};

/** The `$defs` definition an error comes from, such as `link` for `#/$defs/link/pattern`. */
const definitionOf = (error: ErrorObject) => /\$defs\/([^/]+)\/[^/]+$/.exec(error.schemaPath)?.[1];

const description = (schema: unknown): string => {
  const text = (schema as { description?: unknown } | undefined)?.description;
  return typeof text === 'string' ? ` ${text}` : '';
};

const message = (
  error: ErrorObject,
  { hideValues = false }: MessageOptions,
): string | undefined => {
  const field = hideValues ? maskedPath(error.instancePath) : fieldPath(error.instancePath);
  const params = error.params as Record<string, unknown>;
  const value = hideValues ? '' : ` ${shown(error.data)}`;
  const subject = `${field || 'The document'}${value}`;
  switch (error.keyword) {
    case 'required': {
      const name = String(params['missingProperty']);
      const properties = (error.parentSchema as { properties?: Record<string, unknown> })
        ?.properties;
      return `missing "${join(field, name)}".${description(properties?.[name])}`;
    }
    case 'additionalProperties':
    case 'unevaluatedProperties': {
      const name = String(params['additionalProperty'] ?? params['unevaluatedProperty']);
      return `unknown field "${join(field, name)}". Hoverboard doesn't read it.`;
    }
    case 'dependentRequired':
      return `"${join(field, String(params['property']))}" needs "${join(field, String(params['missingProperty']))}" too.`;
    case 'type': {
      // Ajv joins the types of a union with commas.
      const expected = String(params['type'])
        .split(',')
        .map((type) => TYPE_NAMES[type] ?? type)
        .join(' or ');
      const reference = (error.data as { $reference?: unknown } | null)?.$reference;
      if (!hideValues && typeof reference === 'string' && expected.includes('string')) {
        return `${field} is a reference to ${reference}. It must be the ID "${reference.split('/').pop()}".`;
      }
      return `${field || 'The document'} must be ${expected}, not ${kindOf(error.data, hideValues)}.${description(error.parentSchema)}`;
    }
    case 'pattern': {
      // Errors inside `propertyNames` are about a key. The `propertyNames` error names it.
      if (error.propertyName !== undefined) return undefined;
      const meaning =
        PATTERNS[definitionOf(error) ?? ''] ?? `must match ${String(params['pattern'])}`;
      return `${subject} ${meaning}.`;
    }
    case 'propertyNames':
      return hideValues
        ? `${field || 'The document'} has a key that isn't allowed.`
        : `${field || 'The document'} has a key that isn't allowed: "${String(params['propertyName'])}".`;
    case 'maxLength':
      return `${field} is longer than ${String(params['limit'])} characters.`;
    case 'minLength':
      return `${field} is shorter than ${String(params['limit'])} characters.`;
    case 'maximum':
      return `${subject} must be at most ${String(params['limit'])}.`;
    case 'minimum':
      return `${subject} must be at least ${String(params['limit'])}.`;
    case 'maxProperties':
      return `${field || 'The document'} has more than ${String(params['limit'])} entries.`;
    case 'const':
      return `${subject} must be ${shown(params['allowedValue'])}.`;
    case 'enum':
      return `${subject} must be one of ${(params['allowedValues'] as unknown[]).map(shown).join(', ')}.`;
    default:
      return `${field || 'The document'} ${error.message ?? 'is invalid'}.`;
  }
};

/**
 * Plain messages for Ajv's errors about one document, such as
 * `sessions/107: unknown field "extend". Hoverboard doesn't read it.` Ajv needs `verbose: true`,
 * so each error has the data and the schema.
 */
export const documentProblems = (
  documentPath: string,
  errors: readonly ErrorObject[] | null | undefined,
  options: MessageOptions = {},
): string[] => {
  const link = options.url ? ` ${options.url}` : '';
  const messages = (errors ?? []).flatMap((error) => message(error, options) ?? []);
  return [...new Set(messages)].map((text) => `${documentPath}: ${text}${link}`);
};

/** A link to a document in the Firebase console, or in the Emulator UI without a project. */
export const documentUrl = (path: string, projectId?: string): string => {
  const segments = path.split('/').map(encodeURIComponent);
  return projectId
    ? `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/data/~2F${segments.join('~2F')}`
    : `http://127.0.0.1:4000/firestore/default/data/${segments.join('/')}`;
};
