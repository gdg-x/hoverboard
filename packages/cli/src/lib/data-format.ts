import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DocumentReference, type Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, RETIRED, collectionInfo, pathPattern } from '../../../storage/collections.js';
import { siteConfigPath } from '../utils/firebase-project.js';

/** The version of the folder format, for readers to check. */
export const FORMAT = 1;

const MANIFEST = 'manifest.json';
const COLLECTIONS_DIR = 'collections';

export type EntryKind = 'content' | 'visitor' | 'function' | 'cli' | 'retired' | 'unknown';

export interface ManifestEntry {
  /** The file, relative to the folder, such as `collections/sessions--feedback.json`. */
  file: string;
  documents: number;
  kind: EntryKind;
  /** Visitor data, or data Hoverboard doesn't know, which can be personal. */
  personal: boolean;
}

export interface Manifest {
  format: number;
  /** The Hoverboard version that wrote it, from the root package.json. */
  hoverboard: string;
  schemaVersion?: number;
  projectId: string;
  createdAt: string;
  command: string;
  /** By registry path, such as `sessions/*\/feedback` or `config/notifications`. */
  collections: Record<string, ManifestEntry>;
  /** In a backup, documents that didn't exist before, which a restore deletes. */
  created?: string[];
  /**
   * In a backup, what it holds: `all` the data, from `hb backup create`, or the `changes` a fix or
   * an import made. A restore replaces everything in the first, and only what changed in the other.
   */
  scope?: 'all' | 'changes';
  /** The Auth users, from `firebase auth:export`. They're personal data. */
  auth?: { file: string; users: number };
}

/** A document as JSON, with Firestore types tagged as {@link encode} writes them. */
export interface ExportDocument {
  path: string;
  data: Record<string, unknown>;
}

/**
 * The registry path a document is filed under: its own entry, such as `config/notifications`, or
 * its collection's with IDs as `*`, such as `sessions/*\/feedback`. Every `config` document has
 * its own file, since each is a different setting.
 */
export const entryFor = (documentPath: string): string => {
  const collection = documentPath.split('/').slice(0, -1).join('/');
  if (documentPath in COLLECTIONS || documentPath in RETIRED || collection === 'config') {
    return documentPath;
  }
  return pathPattern(collection);
};

/** The file of a registry path: its segments without `*`, joined with `--`. */
export const fileFor = (entry: string): string =>
  `${COLLECTIONS_DIR}/${entry
    .split('/')
    .filter((segment) => segment !== '*')
    .join('--')}.json`;

export const kindOf = (documentPath: string): EntryKind => {
  const info = collectionInfo(documentPath);
  if (info) return info.kind;
  const entry = entryFor(documentPath);
  return entry in RETIRED || documentPath.split('/')[0]! in RETIRED ? 'retired' : 'unknown';
};

/**
 * Whether a document is in a requested path: a document path, or a collection path where `*`
 * matches any ID, such as `partners/*\/items` or `partners/gold/items`.
 */
export const inPath = (documentPath: string, requested: string): boolean => {
  const wanted = requested.replace(/^\/+|\/+$/g, '').split('/');
  const segments = documentPath.split('/');
  const compared = wanted.length % 2 === 0 ? segments : segments.slice(0, -1);
  return (
    compared.length === wanted.length &&
    wanted.every((segment, index) => segment === '*' || segment === compared[index])
  );
};

// Nanoseconds are kept, which `Date` would round to milliseconds.
const timestampText = ({ seconds, nanoseconds }: Timestamp) => {
  const whole = new Date(seconds * 1000).toISOString().slice(0, 19);
  const fraction = String(nanoseconds).padStart(9, '0').replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''}Z`;
};

const parseTimestamp = (text: string): Timestamp => {
  const match = /^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(text);
  if (!match) return Timestamp.fromDate(new Date(text));
  const seconds = Date.parse(`${match[1]}Z`) / 1000;
  return new Timestamp(seconds, Number((match[2] ?? '').padEnd(9, '0').slice(0, 9)));
};

/** Firestore data as JSON, with timestamps, references, geopoints and bytes tagged. */
export const encode = (value: unknown): unknown => {
  if (value instanceof Timestamp) return { $timestamp: timestampText(value) };
  if (value instanceof DocumentReference) return { $reference: value.path };
  if (value instanceof GeoPoint) return { $geopoint: [value.latitude, value.longitude] };
  if (value instanceof Uint8Array) return { $bytes: Buffer.from(value).toString('base64') };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]));
  }
  return value;
};

/** Turns the tags {@link encode} writes back into Firestore values. */
export const decode = (firestore: Firestore, value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => decode(firestore, item));
  if (value && typeof value === 'object') {
    const tagged = value as Record<string, unknown>;
    const keys = Object.keys(tagged);
    if (keys.length === 1) {
      if (typeof tagged['$timestamp'] === 'string') return parseTimestamp(tagged['$timestamp']);
      if (typeof tagged['$reference'] === 'string') return firestore.doc(tagged['$reference']);
      const point = tagged['$geopoint'];
      // GeoPoint throws on anything but numbers.
      if (Array.isArray(point) && point.length === 2) {
        return new GeoPoint(point[0] as number, point[1] as number);
      }
      if (typeof tagged['$bytes'] === 'string') return Buffer.from(tagged['$bytes'], 'base64');
    }
    return Object.fromEntries(keys.map((key) => [key, decode(firestore, tagged[key])]));
  }
  return value;
};

export const isExport = (folder: string): boolean => existsSync(join(folder, MANIFEST));

/** Reads an export, backup or the sample data. */
export const readExport = (folder: string): { manifest: Manifest; documents: ExportDocument[] } => {
  if (!isExport(folder)) {
    throw new Error(`${folder} isn't a Hoverboard export: it has no ${MANIFEST}.`);
  }
  const manifest = JSON.parse(readFileSync(join(folder, MANIFEST), 'utf8')) as Manifest;
  if (manifest.format > FORMAT) {
    throw new Error(`${folder} is in a newer format (${manifest.format}). Upgrade Hoverboard.`);
  }
  const documents = Object.values(manifest.collections).flatMap(({ file }) =>
    Object.entries(
      JSON.parse(readFileSync(join(folder, file), 'utf8')) as Record<
        string,
        Record<string, unknown>
      >,
    ).map(([path, data]) => ({ path, data })),
  );
  return { manifest, documents };
};

/** The Hoverboard version and the site's `schemaVersion`, for a manifest. */
export const versions = (repoRoot: string): Pick<Manifest, 'hoverboard' | 'schemaVersion'> => {
  const read = (path: string) =>
    JSON.parse(readFileSync(join(repoRoot, path), 'utf8')) as Record<string, unknown>;
  const schemaVersion = read(siteConfigPath(repoRoot))['schemaVersion'];
  return {
    hoverboard: String(read('package.json')['version']),
    ...(typeof schemaVersion === 'number' ? { schemaVersion } : {}),
  };
};

/**
 * Writes documents in the format, one file per registry path, with the paths sorted so the files
 * diff well. Replaces an export already in the folder, and refuses any other folder that isn't
 * empty.
 */
export const writeExport = (
  folder: string,
  documents: ExportDocument[],
  meta: Omit<Manifest, 'format' | 'collections'>,
): Manifest => {
  if (existsSync(folder) && readdirSync(folder).length && !isExport(folder)) {
    throw new Error(`${folder} isn't empty, and isn't an export to replace.`);
  }
  rmSync(join(folder, COLLECTIONS_DIR), { recursive: true, force: true });
  mkdirSync(join(folder, COLLECTIONS_DIR), { recursive: true });
  const byEntry = new Map<string, ExportDocument[]>();
  for (const document of documents) {
    const entry = entryFor(document.path);
    byEntry.set(entry, [...(byEntry.get(entry) ?? []), document]);
  }
  const collections: Record<string, ManifestEntry> = {};
  for (const entry of [...byEntry.keys()].sort()) {
    const entryDocuments = byEntry.get(entry)!.sort((a, b) => a.path.localeCompare(b.path));
    const kind = kindOf(entryDocuments[0]!.path);
    const file = fileFor(entry);
    writeFileSync(
      join(folder, file),
      `${JSON.stringify(Object.fromEntries(entryDocuments.map(({ path, data }) => [path, data])), null, 2)}\n`,
    );
    collections[entry] = {
      file,
      documents: entryDocuments.length,
      kind,
      personal: kind === 'visitor' || kind === 'retired' || kind === 'unknown',
    };
  }
  const manifest: Manifest = { format: FORMAT, ...meta, collections };
  saveManifest(folder, manifest);
  return manifest;
};

export const saveManifest = (folder: string, manifest: Manifest): void => {
  writeFileSync(join(folder, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
};

/**
 * Adds documents to a backup, keeping the first copy of each, so it holds them as they were.
 * `created` are documents that didn't exist, which a restore deletes.
 */
export const addToBackup = (
  folder: string,
  documents: ExportDocument[],
  created: string[],
  meta: Omit<Manifest, 'format' | 'collections' | 'created'>,
): void => {
  const before = isExport(folder) ? readExport(folder) : undefined;
  const kept = new Map(before?.documents.map((document) => [document.path, document]));
  for (const document of documents) {
    if (!kept.has(document.path)) kept.set(document.path, document);
  }
  writeExport(folder, [...kept.values()], {
    ...meta,
    scope: 'changes',
    created: [...new Set([...(before?.manifest.created ?? []), ...created])],
  });
};
