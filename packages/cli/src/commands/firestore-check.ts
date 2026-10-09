import type { CollectionReference, Firestore } from 'firebase-admin/firestore';
import { join } from 'path';
import {
  type CollectionInfo,
  RETIRED,
  collectionInfo,
  pathPattern,
} from '../../../storage/collections.js';
import { documentUrl } from '../../../storage/messages.js';
import { toJson } from '../../../storage/validate.js';
import type { Track } from '../../../web/src/schedule/build-schedule.js';
import { documentMessages, scheduleMessages, siteTimeZone } from '../lib/content.js';
import {
  applyFixes,
  backupFolderFor,
  formatPlan,
  planFixes,
  restoreBackup,
  shownPath,
} from '../lib/firestore-fix.js';
import { fixable } from '../lib/fixes.js';
import { confirm } from '../lib/prompt.js';
import { type FirestoreDocument, pendingMigrations } from '../migrations/index.js';
import { SITE_CONFIG_PATH, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { escapeAnnotation } from '../utils/site-config.js';
import { siteFeatures } from '../utils/site-features.js';

export type { FirestoreDocument } from '../migrations/index.js';

export interface Problem {
  message: string;
  /** A problem that doesn't fail the check, such as in the content of a feature that is off. */
  warning: boolean;
  url?: string;
}

export interface Report {
  /** Documents of collections in the registry. */
  checked: number;
  problems: Problem[];
  /** Collections or documents from earlier versions, with their document count. */
  retired: Map<string, number>;
  /** Collections Hoverboard doesn't use, with their document count. */
  unknown: Map<string, number>;
  /** Data migrations the data still needs, with what shows it and the retired collections they read. */
  migrations: { id: string; reason: string; reads: string[] }[];
}

export interface CheckOptions {
  features: Record<string, boolean>;
  /** Whether the documents are the whole database, so links between collections can be checked. */
  complete: boolean;
  tracks?: Track[];
  /** Links go to this project in the Firebase console, or to the Emulator UI without one. */
  projectId?: string;
  /** The event time zone, for fixes that turn timestamps into dates. */
  timeZone?: string;
}

// Firestore takes at most 500 documents in one read. Fewer keeps each request small.
const GET_ALL_SIZE = 300;

/**
 * Every document in the database, or in one collection, with subcollections, and missing
 * documents that have subcollections.
 */
export const listAllDocuments = async (
  firestore: Firestore,
  collectionPath?: string,
): Promise<FirestoreDocument[]> => {
  const walk = async (collections: CollectionReference[]): Promise<FirestoreDocument[]> => {
    const nested = await Promise.all(
      collections.map(async (collection) => {
        const refs = await collection.listDocuments();
        const snapshots = [];
        for (let start = 0; start < refs.length; start += GET_ALL_SIZE) {
          snapshots.push(...(await firestore.getAll(...refs.slice(start, start + GET_ALL_SIZE))));
        }
        return Promise.all(
          snapshots.map(async (snapshot) => {
            const raw = snapshot.data();
            return [
              {
                path: snapshot.ref.path,
                data: raw ? (toJson(raw) as Record<string, unknown>) : undefined,
                raw,
                updateTime: snapshot.updateTime,
              },
              ...(await walk(await snapshot.ref.listCollections())),
            ];
          }),
        );
      }),
    );
    return nested.flat(2);
  };
  return walk(
    collectionPath ? [firestore.collection(collectionPath)] : await firestore.listCollections(),
  );
};

/** The features that are off and make a collection unused, if it is. */
const featuresOff = (info: CollectionInfo, features: Record<string, boolean>): string[] => {
  if (info.kind === 'function' && features['functions'] === false) return ['functions'];
  if (!info.features.length) return [];
  return info.features.every((feature) => features[feature] === false) ? [...info.features] : [];
};

const offNote = (off: string[]) =>
  ` Not an error, because ${off.map((feature) => `features.${feature}`).join(' and ')} ${off.length === 1 ? 'is' : 'are'} off.`;

const count = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

/** Checks documents against the schema, and the links between them. */
export const checkDocuments = (
  documents: FirestoreDocument[],
  { features, complete, tracks, projectId, timeZone = 'UTC' }: CheckOptions,
): Report => {
  const report: Report = {
    checked: 0,
    problems: [],
    retired: new Map(),
    unknown: new Map(),
    migrations: complete
      ? pendingMigrations(documents).map(({ migration, reason }) => ({
          id: migration.id,
          reason,
          reads: migration.reads,
        }))
      : [],
  };
  const sessions: Record<string, Record<string, unknown>> = {};
  const speakers = new Set<string>();
  // Visitor documents are counted by collection and problem, since their IDs can be push tokens.
  const visitorProblems = new Map<string, { pattern: string; text: string; off: string[] }>();
  const visitorCounts = new Map<string, number>();

  for (const { path, data } of documents) {
    const segments = path.split('/');
    const collection = segments.slice(0, -1).join('/');
    const info = collectionInfo(path);
    if (!info) {
      if (!data) continue;
      const retired = [path, pathPattern(collection), segments[0]!].find((key) => key in RETIRED);
      if (retired) count(report.retired, retired);
      else count(report.unknown, collection === 'config' ? path : pathPattern(collection));
      continue;
    }
    const url = documentUrl(path, projectId);
    if (!data) {
      report.problems.push({
        message: `${path} doesn't exist, but has documents in subcollections.`,
        warning: true,
        url,
      });
      continue;
    }
    report.checked++;
    if (collection === 'sessions') sessions[segments[1]!] = data;
    if (collection === 'speakers') speakers.add(segments[1]!);
    const off = featuresOff(info, features);
    for (const message of documentMessages(path, data, {
      fixable: fixable(path, { timeZone }),
    })) {
      if (info.kind === 'visitor') {
        const pattern = pathPattern(collection);
        const text = message.slice(path.length + 2);
        visitorProblems.set(`${pattern}: ${text}`, { pattern, text, off });
        count(visitorCounts, `${pattern}: ${text}`);
        continue;
      }
      report.problems.push({
        message: off.length ? `${message}${offNote(off)}` : message,
        warning: off.length > 0,
        url,
      });
    }
  }
  for (const [key, { pattern, text, off }] of visitorProblems) {
    const fix = ' (fixable)';
    const problem = text.endsWith(fix) ? text.slice(0, -fix.length) : text;
    const message = `${pattern}: ${problem} In ${plural(visitorCounts.get(key)!, 'document')}.${problem === text ? '' : fix}`;
    report.problems.push({
      message: off.length ? `${message}${offNote(off)}` : message,
      warning: off.length > 0,
      ...(pattern.includes('/') ? {} : { url: documentUrl(pattern, projectId) }),
    });
  }
  // Documents are listed in parallel, so sort them for a stable report.
  report.problems.sort((a, b) => a.message.localeCompare(b.message));

  const scheduleOff = features['schedule'] === false ? ['schedule'] : [];
  if (complete || Object.keys(sessions).length) {
    for (const message of scheduleMessages(sessions, tracks)) {
      report.problems.push({
        message: scheduleOff.length ? `${message}${offNote(scheduleOff)}` : message,
        warning: scheduleOff.length > 0,
      });
    }
  }
  if (complete) {
    for (const [id, session] of Object.entries(sessions)) {
      const ids = Array.isArray(session['speakers']) ? session['speakers'] : [];
      for (const speaker of ids.filter((item) => typeof item === 'string' && !speakers.has(item))) {
        report.problems.push({
          message: `sessions/${id}: speaker "${speaker}" doesn't exist.`,
          warning: features['speakers'] === false,
          url: documentUrl(`sessions/${id}`, projectId),
        });
      }
    }
  }
  return report;
};

/** The lines to print for a report, as GitHub annotations in Actions. */
export const formatReport = (
  report: Report,
  { annotations = false, projectId }: { annotations?: boolean; projectId?: string } = {},
): string[] => {
  const line = (warning: boolean, text: string) =>
    annotations
      ? `::${warning ? 'warning' : 'error'} title=Firestore::${escapeAnnotation(text)}`
      : `${warning ? '!' : '✘'} ${text}`;
  const remove = (path: string) =>
    projectId
      ? `npx firebase firestore:delete ${path.includes('/') ? '' : '--recursive '}${path} --project ${projectId}`
      : `the Emulator UI, ${documentUrl(path)}`;
  const errors = report.problems.filter(({ warning }) => !warning).length;
  const fixableCount = report.problems.filter(({ message }) =>
    message.includes('(fixable)'),
  ).length;
  const total = errors + report.migrations.length;

  return [
    ...report.migrations.map(({ id, reason }) =>
      line(false, `Migration ${id} hasn't run: ${reason} Run it with --fix.`),
    ),
    ...report.problems.map(({ message, warning, url }) =>
      line(warning, url ? `${message} ${url}` : message),
    ),
    ...[...report.retired].map(([path, amount]) => {
      const before = `${path}: ${plural(amount, 'document')} from before ${RETIRED[path]}, which Hoverboard no longer uses.`;
      const needed = report.migrations.find(({ reads }) => reads.includes(path));
      return line(
        true,
        needed
          ? `${before} Keep ${amount === 1 ? 'it' : 'them'} until migration ${needed.id} runs.`
          : `${before} Delete ${amount === 1 ? 'it' : 'them'} once you no longer need ${amount === 1 ? 'it' : 'them'}, with ${remove(path)}`,
      );
    }),
    ...[...report.unknown].map(([path, amount]) =>
      line(true, `${path}: ${plural(amount, 'document')} that Hoverboard doesn't use.`),
    ),
    total
      ? `\n✘ Found ${plural(total, 'problem')} in ${plural(report.checked, 'document')}.` +
        (fixableCount + report.migrations.length
          ? ` ${fixableCount + report.migrations.length} can be fixed with --fix.`
          : '')
      : `\n✔ ${plural(report.checked, 'document')} checked, with no problems.`,
  ];
};

export interface FirestoreCheckOptions {
  collection?: string;
  /** Run the pending migrations and the safe fixes. */
  fix?: boolean;
  /** With `fix`, show the changes without writing them. */
  dryRun?: boolean;
  /** With `fix` or `restore`, don't ask before changing production. */
  yes?: boolean;
  /** A backup folder from an earlier `--fix` to write back. */
  restore?: string;
}

/** Asks before production changes. Without a terminal to ask in, it needs `--yes`. */
const allowed = async (projectId: string | undefined, yes: boolean, question: string) => {
  if (!projectId || yes) return true;
  if (!process.stdin.isTTY) {
    console.log(`✘ ${question} Run again with --yes to do it without asking.`);
    return false;
  }
  return confirm(question);
};

/**
 * Checks every document in Firestore, or in one collection, and prints each problem. With `fix`,
 * runs the pending migrations and the safe fixes first. Returns whether there were no errors.
 * Reads the emulator unless FIRESTORE_TARGET=production.
 */
export const runFirestoreCheck = async ({
  collection,
  fix = false,
  dryRun = false,
  yes = false,
  restore,
}: FirestoreCheckOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const projectId =
    process.env['FIRESTORE_TARGET'] === 'production'
      ? resolveFirebaseProjectId(repoRoot)
      : undefined;
  const target = projectId ?? 'the emulator';
  const { firestore } = await import('../lib/firestore.js');

  if (restore) {
    if (!(await allowed(projectId, yes, `Write back the documents in ${restore} to ${target}?`))) {
      return false;
    }
    const count = await restoreBackup(firestore, restore);
    console.log(`✔ Restored ${count} documents from ${restore}.`);
    return true;
  }

  const timeZone = siteTimeZone(join(repoRoot, SITE_CONFIG_PATH));
  const list = () => listAllDocuments(firestore, collection);
  let documents = await list();

  if (fix) {
    const plan = planFixes(documents, timeZone);
    // Migrations need every document, so they don't run for one collection.
    if (collection) plan.migrations = [];
    const lines = formatPlan(plan);
    if (!lines.length) {
      console.log('Nothing to fix.\n');
    } else {
      for (const line of lines) console.log(line);
      if (dryRun) {
        console.log('\nDry run: nothing was written.\n');
      } else if (await allowed(projectId, yes, `\nWrite these changes to ${target}?`)) {
        const { folder, shown } = backupFolderFor(repoRoot);
        const result = await applyFixes({
          firestore,
          plan,
          documents,
          list,
          timeZone,
          repoRoot,
          backupFolder: folder,
        });
        console.log(
          `\n✔ Wrote ${plural(result.written, 'document')}. The documents as they were are in ${shown}. ` +
            `Undo with: ${projectId ? 'FIRESTORE_TARGET=production ' : ''}./hb firestore-check --restore ${shown}`,
        );
        for (const path of result.skipped) {
          console.log(
            `! ${shownPath(path)} changed since the check, so it was left alone. Run --fix again.`,
          );
        }
        console.log('');
        documents = await list();
      } else {
        return false;
      }
    }
  }

  const report = checkDocuments(documents, {
    features: siteFeatures(repoRoot),
    complete: !collection,
    timeZone,
    ...(projectId ? { projectId } : {}),
  });
  const annotations = process.env['GITHUB_ACTIONS'] === 'true';
  for (const line of formatReport(report, { annotations, ...(projectId ? { projectId } : {}) })) {
    console.log(line);
  }
  return !report.problems.some(({ warning }) => !warning) && !report.migrations.length;
};
