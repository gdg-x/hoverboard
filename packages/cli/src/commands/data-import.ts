import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import { type Firestore, Timestamp } from 'firebase-admin/firestore';
import { documentMessages, toJson } from '../../../storage/validate.js';
import type { Track } from '../../../web/src/schedule/build-schedule.js';
import type { CommandResult } from '../lib/command.js';
import { scheduleMessages } from '../lib/content.js';
import {
  type ExportDocument,
  addToBackup,
  decode,
  encode,
  entryFor,
  inPath,
  kindOf,
  readExport,
  versions,
} from '../lib/data-format.js';
import { backupFolderFor, writeSite } from '../lib/firestore-fix.js';
import { DELETE, NOW } from '../lib/fixes.js';
import { confirmChange } from '../lib/prompt.js';
import { productionProjectId } from '../lib/target.js';
import { MIGRATIONS, type FirestoreDocument, type Migration } from '../migrations/index.js';
import { DEMO_PROJECT_ID, siteConfigPath } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { listAllDocuments } from './data-check.js';

export interface ImportOptions {
  /** Only these registry or collection paths, such as `speakers` or `partners/*\/items`. */
  collection?: string[];
  /** Also delete the documents of the imported collections that the export doesn't have. */
  replace?: boolean;
  /** With `replace`, also these registry paths, even when the export has none of their documents. */
  entries?: string[];
  dryRun?: boolean;
  yes?: boolean;
  /** Leaves documents out, such as those of features that are off. */
  include?: (path: string) => boolean;
  /** Writes the documents as they are, without migrations or checks, as a restore does. */
  exact?: boolean;
  /** Also deletes these documents, such as the ones a backed up change created. */
  deletes?: string[];
  /** The command for the backup's manifest. */
  command?: string;
}

interface Counts {
  added: number;
  changed: number;
  unchanged: number;
  deleted: number;
}

export interface ImportPlan {
  writes: FirestoreDocument[];
  /** Documents that the import replaces or deletes, as they are now. */
  replaced: FirestoreDocument[];
  deletes: FirestoreDocument[];
  added: string[];
  counts: Record<string, Counts>;
}

const asDocument = (path: string, raw: Record<string, unknown>): FirestoreDocument => ({
  path,
  raw,
  data: toJson(raw) as Record<string, unknown>,
});

/**
 * Runs the migrations the documents still need, in memory, as `data check --fix` would on the
 * database. Returns the migrated documents, and site.json with their changes.
 */
export const migrate = (
  documents: FirestoreDocument[],
  site: Record<string, unknown>,
  migrations: Migration[] = MIGRATIONS,
) => {
  const byPath = new Map(documents.map((document) => [document.path, document]));
  const applied: { migration: Migration; lines: string[]; warnings: string[] }[] = [];
  let siteChanged = false;
  for (const migration of migrations) {
    const current = [...byPath.values()];
    if (!migration.pending(current)) continue;
    const plan = migration.plan(current);
    for (const { path, fields } of plan.updates) {
      const raw = { ...byPath.get(path)!.raw };
      for (const [field, value] of Object.entries(fields)) {
        if (value === DELETE) delete raw[field];
        else raw[field] = value === NOW ? Timestamp.now() : value;
      }
      byPath.set(path, asDocument(path, raw));
    }
    for (const { path, data } of plan.creates) byPath.set(path, asDocument(path, data));
    for (const { from, to } of plan.moves ?? []) {
      byPath.set(to, { ...byPath.get(from)!, path: to });
      byPath.delete(from);
    }
    if (plan.site) {
      site = plan.site(site);
      siteChanged = true;
    }
    applied.push({ migration, lines: plan.lines, warnings: plan.warnings });
  }
  return { documents: [...byPath.values()], site, siteChanged, applied };
};

/** The problems that stop an import: invalid content, and sessions the schedule can't show. */
export const importProblems = (documents: FirestoreDocument[], tracks: Track[]): string[] => {
  const content = documents.filter(({ path }) => kindOf(path) === 'content');
  const sessions = Object.fromEntries(
    content
      .filter(({ path }) => path.split('/').length === 2 && path.startsWith('sessions/'))
      .map(({ path, data }) => [path.split('/')[1]!, data]),
  );
  return [
    ...content.flatMap(({ path, data }) => documentMessages(path, data)),
    ...(Object.keys(sessions).length ? scheduleMessages(sessions, tracks) : []),
  ];
};

// Firestore doesn't keep the order of fields, so they're compared sorted.
const sorted = (_key: string, value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
    : value;

const same = (a: unknown, b: unknown) =>
  JSON.stringify(encode(a), sorted) === JSON.stringify(encode(b), sorted);

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

const capitalize = (text: string) => `${text[0]!.toUpperCase()}${text.slice(1)}`;

/** What an import writes and deletes, against the documents there now. */
export const planImport = (
  documents: FirestoreDocument[],
  existing: FirestoreDocument[],
  {
    replace = false,
    include = () => true,
    deletes = [],
    collection = [],
    entries: extraEntries = [],
  }: Pick<ImportOptions, 'replace' | 'include' | 'deletes' | 'collection' | 'entries'> = {},
): ImportPlan => {
  const now = new Map(
    existing.filter(({ raw }) => raw).map((document) => [document.path, document]),
  );
  const entries = new Set([...documents.map(({ path }) => entryFor(path)), ...extraEntries]);
  const replaced = (path: string) =>
    replace &&
    entries.has(entryFor(path)) &&
    (!collection.length || collection.some((requested) => inPath(path, requested)));
  const counts: Record<string, Counts> = {};
  const count = (path: string, key: keyof Counts) => {
    const entry = entryFor(path);
    counts[entry] ??= { added: 0, changed: 0, unchanged: 0, deleted: 0 };
    counts[entry][key]++;
  };
  const plan: ImportPlan = { writes: [], replaced: [], deletes: [], added: [], counts };
  for (const document of documents) {
    const before = now.get(document.path);
    if (!before) {
      count(document.path, 'added');
      plan.added.push(document.path);
      plan.writes.push(document);
    } else if (same(before.raw, document.raw)) {
      count(document.path, 'unchanged');
    } else {
      count(document.path, 'changed');
      plan.replaced.push(before);
      plan.writes.push(document);
    }
  }
  if (replace || deletes.length) {
    const imported = new Set(documents.map(({ path }) => path));
    const listed = new Set(deletes);
    for (const document of now.values()) {
      if (imported.has(document.path) || !include(document.path)) continue;
      if (!listed.has(document.path) && !replaced(document.path)) continue;
      count(document.path, 'deleted');
      plan.replaced.push(document);
      plan.deletes.push(document);
    }
  }
  return plan;
};

const countLine = (entry: string, { added, changed, unchanged, deleted }: Counts) =>
  `  ${entry}: ${[
    added && `${added} new`,
    changed && `${changed} changed`,
    unchanged && `${unchanged} unchanged`,
    deleted && `${deleted} deleted`,
  ]
    .filter(Boolean)
    .join(', ')}`;

/** Writes the documents with a BulkWriter, which has no batch size limit. */
const write = async (firestore: Firestore, { writes, deletes }: ImportPlan) => {
  const writer = firestore.bulkWriter();
  const settled = Promise.allSettled([
    ...writes.map(({ path, raw }) => writer.set(firestore.doc(path), raw!)),
    ...deletes.map(({ path }) => writer.delete(firestore.doc(path))),
  ]);
  await writer.close();
  const failed = (await settled).flatMap((result) =>
    result.status === 'rejected' ? [String((result.reason as Error).message ?? result.reason)] : [],
  );
  if (failed.length) {
    throw new Error(`${failed.length} writes failed, such as: ${failed[0]}`);
  }
};

const readSite = (repoRoot: string) =>
  JSON.parse(readFileSync(join(repoRoot, siteConfigPath(repoRoot)), 'utf8')) as Record<
    string,
    unknown
  >;

/**
 * Imports an export into Firestore: runs the migrations it needs, checks every document, backs
 * up what it replaces, then writes. Writes nothing when a document is invalid.
 */
export const runDataImport = async (
  folder: string,
  options: ImportOptions = {},
): Promise<CommandResult | false> => {
  const source = resolve(process.env['INIT_CWD'] ?? process.cwd(), folder);
  return importDocuments(readExport(source).documents, source, options);
};

/** Imports documents in the export format, from `source`, as {@link runDataImport} does. */
export const importDocuments = async (
  exported: ExportDocument[],
  source: string,
  {
    collection = [],
    replace = false,
    entries = [],
    dryRun = false,
    yes = false,
    include = () => true,
    exact = false,
    deletes = [],
    command = 'hb data import',
  }: ImportOptions = {},
): Promise<CommandResult | false> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const projectId = productionProjectId(repoRoot);
  const target = projectId ?? 'the emulator';
  const { firestore } = await import('../lib/firestore.js');

  const toDocument = ({ path, data }: ExportDocument) =>
    asDocument(path, decode(firestore, data) as Record<string, unknown>);
  const selected = exported.filter(
    ({ path }) =>
      include(path) &&
      (!collection.length || collection.some((requested) => inPath(path, requested))),
  );
  // Migrations need every document, so they don't run for part of an export.
  const migrated =
    collection.length || exact
      ? {
          documents: selected.map(toDocument),
          site: readSite(repoRoot),
          siteChanged: false,
          applied: [],
        }
      : migrate(selected.map(toDocument), readSite(repoRoot));
  for (const { migration, lines, warnings } of migrated.applied) {
    console.log(`Migration ${migration.id}: ${migration.description}`);
    for (const line of lines) console.log(`  ${line}`);
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  const tracks = (migrated.site['schedule'] as { tracks?: Track[] } | undefined)?.tracks ?? [];
  const problems = exact ? [] : importProblems(migrated.documents, tracks);
  if (problems.length) {
    for (const problem of problems) console.log(`✘ ${problem}`);
    console.log(`\n✘ Nothing was imported: ${source} has ${problems.length} problems.`);
    return false;
  }

  const roots = [
    ...new Set(
      [...migrated.documents.map(({ path }) => path), ...deletes, ...(replace ? entries : [])].map(
        (path) => path.split('/')[0]!,
      ),
    ),
  ];
  const existing = (
    await Promise.all(roots.map((root) => listAllDocuments(firestore, root)))
  ).flat();
  const plan = planImport(migrated.documents, existing, {
    replace,
    include,
    deletes,
    collection,
    entries,
  });
  console.log(`Import ${source} into ${target}:`);
  for (const [entry, counts] of Object.entries(plan.counts).sort()) {
    console.log(countLine(entry, counts));
  }
  const counts = { written: plan.writes.length, deleted: plan.deletes.length };
  const result = { ok: true, collections: plan.counts, ...counts, dryRun };
  if (!plan.writes.length && !plan.deletes.length && !migrated.applied.length) {
    console.log(`✔ Nothing to write: ${target} already has this data.`);
    return result;
  }
  const summary = (write: string, remove: string) =>
    [
      counts.written ? `${write} ${plural(counts.written, 'document')}` : '',
      counts.deleted ? `${remove} ${plural(counts.deleted, 'document')}` : '',
    ]
      .filter(Boolean)
      .join(' and ') || `${write} site.json`;
  if (dryRun) {
    console.log(`\nDry run: would ${summary('write', 'delete')}. Nothing was written.`);
    return result;
  }
  if (
    projectId &&
    !(await confirmChange(
      `\n${capitalize(summary('write', 'delete'))} in ${projectId}? What it replaces is backed up first.`,
      yes,
    ))
  ) {
    return false;
  }

  let backup: string | undefined;
  if (plan.replaced.length) {
    const { folder: backupFolder, shown } = backupFolderFor(repoRoot);
    addToBackup(
      backupFolder,
      plan.replaced.map(({ path, raw }) => ({
        path,
        data: encode(raw) as Record<string, unknown>,
      })),
      plan.added,
      {
        ...versions(repoRoot),
        projectId: projectId ?? DEMO_PROJECT_ID,
        createdAt: new Date().toISOString(),
        command,
      },
    );
    backup = shown;
  }
  if (migrated.siteChanged) {
    writeSite(repoRoot, () => migrated.site);
  }
  await write(firestore, plan);
  console.log(`\n✔ ${capitalize(summary('wrote', 'deleted'))} in ${target}.`);
  if (migrated.siteChanged) {
    console.log(`  Commit ${siteConfigPath(repoRoot)}, which the migrations changed.`);
  }
  if (backup) {
    console.log(
      `  What it replaced is in ${backup}. Undo with: ./hb backup restore ${backup}${projectId ? ' --production' : ''}`,
    );
  }
  return { ...result, ...(backup ? { backup } : {}) };
};
