import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { FieldPath, FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { collectionInfo, pathPattern } from '../../../storage/collections.js';
import { toJson } from '../../../storage/validate.js';
import type { FirestoreDocument, Migration, MigrationPlan } from '../migrations/index.js';
import { pendingMigrations } from '../migrations/index.js';
import { SITE_CONFIG_PATH } from '../utils/firebase-project.js';
import { DELETE, type FieldFix, NOW, documentFixes, fieldUpdates } from './fixes.js';
import { runCommand } from './spawn.js';

export const BACKUPS_PATH = '.firebase/backups';

// gRPC codes for a write whose precondition failed, and a document that already exists.
const FAILED_PRECONDITION = 9;
const ALREADY_EXISTS = 6;

export interface DocumentFix {
  document: FirestoreDocument;
  fixes: FieldFix[];
}

export interface FixPlan {
  migrations: { migration: Migration; plan: MigrationPlan }[];
  fixes: DocumentFix[];
}

/** The pending migrations and the safe fixes for the documents. */
export const planFixes = (documents: FirestoreDocument[], timeZone: string): FixPlan => ({
  migrations: pendingMigrations(documents).map(({ migration }) => ({
    migration,
    plan: migration.plan(documents),
  })),
  fixes: documents.flatMap((document) => {
    if (!document.data || !document.raw) return [];
    const fixes = documentFixes(document.path, document.data, { timeZone });
    return fixes.length ? [{ document, fixes }] : [];
  }),
});

/** A document path to print. Visitor document IDs can be push tokens or user IDs, so they're left out. */
export const shownPath = (path: string) =>
  collectionInfo(path)?.kind === 'visitor'
    ? `${pathPattern(path.split('/').slice(0, -1).join('/'))} (a document)`
    : path;

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

/** The fixes, one line each. Visitor documents are counted by collection and fix. */
const fixLines = (fixes: DocumentFix[]): string[] => {
  const counts = new Map<string, number>();
  for (const { document, fixes: documentFixList } of fixes) {
    const visitor = collectionInfo(document.path)?.kind === 'visitor';
    const collection = pathPattern(document.path.split('/').slice(0, -1).join('/'));
    for (const description of new Set(documentFixList.map((fix) => fix.description))) {
      const key = visitor ? `${collection}: ${description}` : `${document.path}: ${description}`;
      counts.set(key, (counts.get(key) ?? 0) + (visitor ? 1 : 0));
    }
  }
  return [...counts].map(([key, amount]) =>
    amount ? `  ${key}, in ${plural(amount, 'document')}` : `  ${key}`,
  );
};

/** The lines that show a plan before anything is written. */
export const formatPlan = ({ migrations, fixes }: FixPlan): string[] => [
  ...migrations.flatMap(({ migration, plan }) => [
    `Migration ${migration.id}: ${migration.description}`,
    ...plan.lines.map((line) => `  ${line}`),
    ...plan.warnings.map((warning) => `  ! ${warning}`),
  ]),
  ...(fixes.length ? ['Fixes:', ...fixLines(fixes)] : []),
];

/** A backup folder name for now, without colons, which Windows doesn't allow in file names. */
export const backupName = (now = new Date()) => now.toISOString().replaceAll(':', '-');

interface Backup {
  /** Documents as they were, as JSON. */
  documents: Record<string, unknown>;
  /** Documents that didn't exist, which a restore deletes. */
  created: string[];
}

/** Adds documents to a backup, keeping the first copy of each, so it holds them as they were. */
const addToBackup = (folder: string, documents: FirestoreDocument[], created: string[] = []) => {
  const file = join(folder, 'documents.json');
  const backup: Backup = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Backup)
    : { documents: {}, created: [] };
  for (const { path, raw } of documents) {
    if (raw && !(path in backup.documents)) backup.documents[path] = toJson(raw);
  }
  backup.created.push(...created.filter((path) => !backup.created.includes(path)));
  mkdirSync(folder, { recursive: true });
  writeFileSync(file, `${JSON.stringify(backup, null, 2)}\n`);
};

const toFirestore = (fields: Record<string, unknown>): unknown[] =>
  Object.entries(fields).flatMap(([field, value]) => [
    new FieldPath(field),
    value === DELETE ? FieldValue.delete() : value === NOW ? FieldValue.serverTimestamp() : value,
  ]);

/** Turns the schema's JSON for timestamps and references back into Firestore values. */
export const fromJson = (firestore: Firestore, value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => fromJson(firestore, item));
  if (value && typeof value === 'object') {
    const json = value as { $timestamp?: unknown; $reference?: unknown };
    if (typeof json.$timestamp === 'string') return Timestamp.fromDate(new Date(json.$timestamp));
    if (typeof json.$reference === 'string') return firestore.doc(json.$reference);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fromJson(firestore, item)]),
    );
  }
  return value;
};

const code = (error: unknown) => (error as { code?: number }).code;

export interface FixResult {
  written: number;
  /** Documents that changed since the check, or already existed, and were left alone. */
  skipped: string[];
}

/** Updates or deletes a document only if it hasn't changed since it was read. */
const update = async (
  firestore: Firestore,
  document: FirestoreDocument,
  fields: Record<string, unknown> | typeof DELETE,
  result: FixResult,
) => {
  const precondition = { lastUpdateTime: document.updateTime as Timestamp };
  try {
    if (fields === DELETE) {
      await firestore.doc(document.path).delete(precondition);
    } else {
      const [field, value, ...rest] = toFirestore(fields);
      await firestore.doc(document.path).update(field as FieldPath, value, ...rest, precondition);
    }
    result.written++;
  } catch (error) {
    if (code(error) !== FAILED_PRECONDITION) throw error;
    result.skipped.push(document.path);
  }
};

/** Changes packages/config/site.json, then formats it with Prettier. */
export const writeSite = (repoRoot: string, change: NonNullable<MigrationPlan['site']>) => {
  const path = join(repoRoot, SITE_CONFIG_PATH);
  const site = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  writeFileSync(path, `${JSON.stringify(change(site), null, 2)}\n`);
  const prettier = join(repoRoot, 'node_modules', '.bin', 'prettier');
  if (existsSync(prettier)) {
    runCommand(prettier, ['--log-level', 'warn', '--write', SITE_CONFIG_PATH], repoRoot);
  }
};

/**
 * Runs the planned migrations, then lists the documents again and applies the safe fixes. Every
 * document is backed up before it changes, and each write checks the document hasn't changed
 * since it was read.
 */
export const applyFixes = async ({
  firestore,
  plan,
  documents,
  list,
  timeZone,
  repoRoot,
  backupFolder,
}: {
  firestore: Firestore;
  plan: FixPlan;
  documents: FirestoreDocument[];
  /** Lists the documents again, after the migrations changed some. */
  list: () => Promise<FirestoreDocument[]>;
  timeZone: string;
  repoRoot: string;
  backupFolder: string;
}): Promise<FixResult> => {
  const result: FixResult = { written: 0, skipped: [] };
  const byPath = new Map(documents.map((document) => [document.path, document]));

  for (const { migration, plan: migrationPlan } of plan.migrations) {
    const moves = migrationPlan.moves ?? [];
    addToBackup(
      backupFolder,
      [...migrationPlan.updates, ...moves.map(({ from }) => ({ path: from }))].flatMap(
        ({ path }) => byPath.get(path) ?? [],
      ),
      [...migrationPlan.creates.map(({ path }) => path), ...moves.map(({ to }) => to)],
    );
    const before = { written: result.written, skipped: result.skipped.length };
    for (const { path, fields } of migrationPlan.updates) {
      await update(firestore, byPath.get(path)!, fields, result);
    }
    for (const { path, data } of migrationPlan.creates) {
      try {
        await firestore.doc(path).create(data);
        result.written++;
      } catch (error) {
        if (code(error) !== ALREADY_EXISTS) throw error;
        result.skipped.push(path);
      }
    }
    for (const { from, to } of moves) {
      const document = byPath.get(from)!;
      // One batch, so a document changed since the check is neither copied nor deleted.
      const batch = firestore.batch();
      batch.create(firestore.doc(to), document.raw!);
      batch.delete(firestore.doc(from), { lastUpdateTime: document.updateTime as Timestamp });
      try {
        await batch.commit();
        result.written++;
      } catch (error) {
        if (code(error) !== FAILED_PRECONDITION && code(error) !== ALREADY_EXISTS) throw error;
        result.skipped.push(from);
      }
    }
    if (migrationPlan.site) writeSite(repoRoot, migrationPlan.site);
    // A migration that skipped documents stays pending, so --fix runs it again.
    if (result.skipped.length > before.skipped) continue;
    await firestore.doc('config/migrations').set(
      {
        [migration.id]: {
          ranAt: FieldValue.serverTimestamp(),
          documents: result.written - before.written,
        },
      },
      { merge: true },
    );
  }

  // The migrations changed some documents, so their fixes come from what they are now.
  const fixes = plan.migrations.length ? planFixes(await list(), timeZone).fixes : plan.fixes;
  addToBackup(
    backupFolder,
    fixes.map(({ document }) => document),
  );
  for (const { document, fixes: documentFixList } of fixes) {
    const deleted = documentFixList.some(({ segments }) => !segments.length);
    await update(
      firestore,
      document,
      deleted ? DELETE : fieldUpdates(document.raw!, documentFixList),
      result,
    );
  }
  return result;
};

/** Writes back the documents in a backup, and deletes the ones the fix created. */
export const restoreBackup = async (firestore: Firestore, folder: string): Promise<number> => {
  const backup = JSON.parse(readFileSync(join(folder, 'documents.json'), 'utf8')) as Backup;
  for (const [path, data] of Object.entries(backup.documents)) {
    await firestore.doc(path).set(fromJson(firestore, data) as Record<string, unknown>);
  }
  for (const path of backup.created) await firestore.doc(path).delete();
  return Object.keys(backup.documents).length + backup.created.length;
};

/** The backup folder for a fix that starts now, relative to the repository for messages. */
export const backupFolderFor = (repoRoot: string, now = new Date()) => {
  const folder = join(repoRoot, BACKUPS_PATH, backupName(now));
  return { folder, shown: relative(repoRoot, folder) };
};
