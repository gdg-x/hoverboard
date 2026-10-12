import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { cwd } from 'node:process';
import { dirname, join } from 'node:path';
import type { DocumentData, Firestore } from 'firebase-admin/firestore';
import { collectionInfo } from '../../../storage/collections';
import type { Feature } from '../config/features';

export interface SampleDocument {
  path: string;
  data: DocumentData;
}

interface Manifest {
  collections: Record<string, { file: string }>;
}

/** `docs/sample-data`, from Astro (in packages/web) or Vitest (in the repo root). */
const sampleFolder = () => {
  for (let dir = cwd(); ; dir = dirname(dir)) {
    const folder = join(dir, 'docs', 'sample-data');
    if (existsSync(join(folder, 'manifest.json'))) return folder;
    if (dirname(dir) === dir) throw new Error(`No docs/sample-data above ${cwd()}.`);
  }
};

/**
 * The sample data's documents of the features that are on, as `hb data seed` imports them. Values
 * stay as JSON: a tagged one, such as `{ "$timestamp": ... }`, fails the build's schema check.
 */
export const sampleDocuments = (folder = sampleFolder()): SampleDocument[] => {
  const read = <T>(file: string) => JSON.parse(readFileSync(join(folder, file), 'utf8')) as T;
  return Object.values(read<Manifest>('manifest.json').collections)
    .flatMap(({ file }) => Object.entries(read<Record<string, DocumentData>>(file)))
    .map(([path, data]) => ({ path, data }))
    .filter(({ path }) => {
      const features = collectionInfo(path)?.features ?? [];
      return !features.length || features.some((feature) => __HB_FEATURES__[feature as Feature]);
    });
};

const compareBytes = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));

// Firestore orders document names segment by segment.
const comparePaths = (a: string, b: string) => {
  const [left, right] = [a.split('/'), b.split('/')];
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const order = compareBytes(left[index]!, right[index]!);
    if (order) return order;
  }
  return left.length - right.length;
};

// Firestore's order of types, for the values content is ordered by.
const TYPE_ORDER = ['null', 'boolean', 'number', 'string'];

const typeOf = (value: unknown) => {
  const type = value === null ? 'null' : typeof value;
  if (!TYPE_ORDER.includes(type)) throw new Error(`Can't order sample data by ${type} values.`);
  return type;
};

const compareValues = (a: unknown, b: unknown) => {
  const [left, right] = [typeOf(a), typeOf(b)];
  if (left !== right) return TYPE_ORDER.indexOf(left) - TYPE_ORDER.indexOf(right);
  if (left === 'string') return compareBytes(a as string, b as string);
  return Number(a) - Number(b);
};

const snapshot = ({ path, data }: SampleDocument) => {
  const segments = path.split('/');
  return {
    id: segments.at(-1)!,
    data: () => structuredClone(data),
    ref: {
      path,
      parent: { parent: segments.length > 2 ? { id: segments.at(-3)! } : null },
    },
  };
};

const query = (documents: SampleDocument[], field?: string, direction = 'asc') => ({
  orderBy: (by: string, order = 'asc') => query(documents, by, order),
  get: () => {
    // As in Firestore, ordering by a field leaves out documents without it, and ties go by path.
    const sign = direction === 'desc' ? -1 : 1;
    const docs = documents
      .filter(({ data }) => field === undefined || field in data)
      .sort(
        (a, b) =>
          sign *
          ((field === undefined ? 0 : compareValues(a.data[field], b.data[field])) ||
            comparePaths(a.path, b.path)),
      )
      .map(snapshot);
    return Promise.resolve({ docs });
  },
});

/** The sample data as the part of Firestore that the build reads, for `FIRESTORE_TARGET=sample`. */
export const sampleFirestore = (documents = sampleDocuments()): Firestore => {
  const parentPath = (path: string) => path.split('/').slice(0, -1).join('/');
  return {
    collection: (path: string) =>
      query(documents.filter((document) => parentPath(document.path) === path)),
    collectionGroup: (id: string) =>
      query(documents.filter(({ path }) => path.split('/').at(-2) === id)),
  } as unknown as Firestore;
};
