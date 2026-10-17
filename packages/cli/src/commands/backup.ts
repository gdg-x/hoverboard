import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join, relative, resolve } from 'path';
import { isBillingEnabled } from '../lib/billing.js';
import { type CommandResult, UsageError } from '../lib/command.js';
import {
  type ExportDocument,
  type Manifest,
  isExport,
  readExport,
  saveManifest,
  versions,
  writeExport,
} from '../lib/data-format.js';
import {
  type AuthUser,
  type BackupSchedule,
  consoleBackupsUrl,
  createSchedule,
  deleteSchedule,
  describeSchedule,
  exportUsers,
  importUsers,
  listManagedBackups,
  listSchedules,
  pitrEnabled,
  retentionDays,
  setPitr,
} from '../lib/firebase-backups.js';
import { BACKUPS_PATH, backupFolderFor } from '../lib/firestore-fix.js';
import { confirmChange } from '../lib/prompt.js';
import { productionProjectId } from '../lib/target.js';
import { DEMO_PROJECT_ID, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { exportDocuments, manifestLines } from './data-export.js';
import { importDocuments } from './data-import.js';

/** Where a backup keeps the Auth users, relative to its folder. */
const AUTH_FILE = 'auth/users.json';

/** The name of a backup a schedule made, which only Firestore can restore. */
const MANAGED = /^projects\/([^/]+)\/locations\/[^/]+\/backups\/[^/]+$/;

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// The longest retention Firestore allows: 7 days for daily backups, 14 weeks for weekly ones.
// Verify these limits in the Firestore docs.
const MAX_RETENTION = { daily: 7, weekly: 98 };

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

const repoRootOf = () => findRepoRoot(process.cwd()) ?? process.cwd();

/** A path to print: relative to the repository when it's inside it. */
const shownPath = (repoRoot: string, path: string) => {
  const shown = relative(repoRoot, path);
  return shown && !shown.startsWith('..') ? shown : path;
};

const readUsers = (file: string): AuthUser[] =>
  (JSON.parse(readFileSync(file, 'utf8')) as { users?: AuthUser[] }).users ?? [];

const writeUsers = (file: string, users: AuthUser[]) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ users }, null, 2)}\n`);
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};

const folderSize = (folder: string): number =>
  readdirSync(folder, { withFileTypes: true }).reduce((total, entry) => {
    const path = join(folder, entry.name);
    return total + (entry.isDirectory() ? folderSize(path) : statSync(path).size);
  }, 0);

export interface Backup {
  manifest?: Manifest;
  documents: ExportDocument[];
  /** Documents that didn't exist before the change, which a restore deletes. */
  created: string[];
  scope: 'all' | 'changes';
}

/**
 * Reads a backup or an export. Also reads the `documents.json` of backups from `data check --fix`
 * before the data format.
 */
export const readBackup = (folder: string): Backup => {
  if (isExport(folder)) {
    const { manifest, documents } = readExport(folder);
    return { manifest, documents, created: manifest.created ?? [], scope: manifest.scope ?? 'all' };
  }
  const legacyFile = join(folder, 'documents.json');
  if (!existsSync(legacyFile)) {
    throw new UsageError(`${folder} isn't a backup or an export: it has no manifest.json.`);
  }
  const legacy = JSON.parse(readFileSync(legacyFile, 'utf8')) as {
    documents: Record<string, Record<string, unknown>>;
    created?: string[];
  };
  return {
    documents: Object.entries(legacy.documents).map(([path, data]) => ({ path, data })),
    created: legacy.created ?? [],
    scope: 'changes',
  };
};

/** The folder of a backup: a path, or a name in .firebase/backups. */
const findBackup = (repoRoot: string, backup: string): string => {
  const asPath = resolve(process.env['INIT_CWD'] ?? process.cwd(), backup);
  if (existsSync(asPath)) return asPath;
  const named = join(repoRoot, BACKUPS_PATH, backup);
  if (existsSync(named)) return named;
  throw new UsageError(`There's no backup at ${backup}. ./hb backup list shows them.`);
};

/** Adds Auth users to a backup folder, creating it if needed. */
const addUsersToBackup = (
  folder: string,
  users: AuthUser[],
  meta: Omit<Manifest, 'format' | 'collections'>,
) => {
  if (!isExport(folder)) writeExport(folder, [], meta);
  writeUsers(join(folder, AUTH_FILE), users);
  const { manifest } = readExport(folder);
  saveManifest(folder, { ...manifest, auth: { file: AUTH_FILE, users: users.length } });
};

/**
 * Backs up every Firestore document, with collections Hoverboard doesn't use, to
 * .firebase/backups/<time>. On production, also backs up the Auth users.
 */
export const runBackupCreate = async ({ auth = true }: { auth?: boolean } = {}): Promise<
  CommandResult | false
> => {
  const repoRoot = repoRootOf();
  const projectId = productionProjectId(repoRoot);
  const target = projectId ?? 'the emulator';
  const { folder, shown } = backupFolderFor(repoRoot);
  const { firestore } = await import('../lib/firestore.js');

  const documents = await exportDocuments(firestore, { all: true });
  const meta = {
    ...versions(repoRoot),
    projectId: projectId ?? DEMO_PROJECT_ID,
    createdAt: new Date().toISOString(),
    command: 'hb backup create',
    scope: 'all' as const,
  };
  const manifest = writeExport(folder, documents, meta);
  for (const line of manifestLines(manifest)) console.log(line);

  let users: number | undefined;
  if (auth && projectId) {
    const file = join(folder, AUTH_FILE);
    mkdirSync(dirname(file), { recursive: true });
    try {
      await exportUsers(repoRoot, projectId, file);
    } catch (error) {
      console.log(`✘ Couldn't back up the Auth users: ${(error as Error).message}`);
      console.log(`  The Firestore documents are in ${shown}.`);
      return false;
    }
    users = readUsers(file).length;
    saveManifest(folder, { ...manifest, auth: { file: AUTH_FILE, users } });
    console.log(`  Auth: ${plural(users, 'user')} (personal data)`);
  }

  console.log(
    `✔ Backed up ${plural(documents.length, 'document')}${users === undefined ? '' : ` and ${plural(users, 'user')}`} ` +
      `from ${target} to ${shown}.`,
  );
  console.log(`  Restore with: ./hb backup restore ${shown}${projectId ? ' --production' : ''}`);
  if (users || Object.values(manifest.collections).some(({ personal }) => personal)) {
    console.log(
      '! It holds personal data, such as emails or push tokens. Keep it private, and delete it ' +
        'when you no longer need it.',
    );
  }
  return {
    ok: true,
    folder: shown,
    documents: documents.length,
    ...(users === undefined ? {} : { users }),
  };
};

export interface LocalBackup {
  name: string;
  /** `all` from `backup create`, `changes` from a fix, an import or a restore. */
  scope: 'all' | 'changes';
  bytes: number;
  documents?: number;
  users?: number;
  projectId?: string;
  command?: string;
}

/** The backups in .firebase/backups, oldest first. */
export const localBackups = (repoRoot: string): LocalBackup[] => {
  const root = join(repoRoot, BACKUPS_PATH);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort()
    .map((name) => {
      const folder = join(root, name);
      const bytes = folderSize(folder);
      if (!isExport(folder)) return { name, scope: 'changes' as const, bytes };
      const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8')) as Manifest;
      return {
        name,
        scope: manifest.scope ?? 'all',
        bytes,
        documents: Object.values(manifest.collections).reduce(
          (total, { documents }) => total + documents,
          0,
        ),
        ...(manifest.auth ? { users: manifest.auth.users } : {}),
        projectId: manifest.projectId,
        command: manifest.command,
      };
    });
};

const localLine = ({ name, scope, bytes, documents, users, projectId, command }: LocalBackup) => {
  const what = [
    documents === undefined ? 'documents' : plural(documents, 'document'),
    users === undefined ? '' : plural(users, 'user'),
  ]
    .filter(Boolean)
    .join(' and ');
  const from = projectId ? ` from ${projectId}` : '';
  const by = command ? `, by ${command}` : '';
  return `  ${name}: ${scope === 'all' ? 'all data' : 'changes'}, ${what}${from}, ${formatBytes(bytes)}${by}`;
};

/** Lists the local backups and, on production, the schedules and the backups they made. */
export const runBackupList = async (): Promise<CommandResult> => {
  const repoRoot = repoRootOf();
  const projectId = productionProjectId(repoRoot);
  const local = localBackups(repoRoot);
  if (local.length) {
    console.log(`Backups in ${BACKUPS_PATH}:`);
    for (const backup of local) console.log(localLine(backup));
  } else {
    console.log(`No backups in ${BACKUPS_PATH}. ./hb backup create makes one.`);
  }
  if (!projectId) return { ok: true, local };

  try {
    const [schedules, pitr, managed] = await Promise.all([
      listSchedules(repoRoot, projectId),
      pitrEnabled(repoRoot, projectId),
      listManagedBackups(repoRoot, projectId),
    ]);
    console.log(
      `\nScheduled backups of ${projectId}: ${
        schedules.length
          ? schedules.map(describeSchedule).join('; ')
          : 'none. ./hb backup schedule --daily sets them up.'
      }`,
    );
    console.log(`Point-in-time recovery: ${pitr ? 'on' : 'off'}.`);
    if (managed.length) {
      console.log('Backups in Firestore:');
      for (const { name, snapshotTime, expireTime, state, stats } of managed) {
        const size = stats?.sizeBytes ? `${formatBytes(Number(stats.sizeBytes))}, ` : '';
        const until = expireTime ? `kept until ${expireTime.slice(0, 10)}` : '';
        const ready = state && state !== 'READY' ? `, ${state.toLowerCase()}` : '';
        console.log(`  ${snapshotTime ?? '?'}: ${size}${until}${ready}\n    ${name}`);
      }
    }
    return { ok: true, local, schedules, pitr, managed };
  } catch (error) {
    console.log(`\n! Couldn't list the backups in Firestore: ${(error as Error).message}`);
    return { ok: true, local };
  }
};

/** Prints how to restore a backup a schedule made. Only Firestore can, into a new database. */
const managedSteps = (backup: string, projectId: string): CommandResult => {
  console.log(
    [
      `${backup} is a backup in Firestore. Firestore restores it into a new database, not the`,
      'one the site uses. To restore it (verify these steps):',
      `  1. npx firebase firestore:databases:restore --database restored --backup ${backup} --project ${projectId}`,
      `  2. Check the data in the restored database: ${consoleBackupsUrl(projectId)}`,
      `  3. Export the restored database to a bucket, and import it into (default):`,
      `     gcloud firestore export gs://<bucket>/restored --database=restored --project=${projectId}`,
      `     gcloud firestore import gs://<bucket>/restored --database='(default)' --project=${projectId}`,
      '  4. Delete the restored database and the bucket folder, which cost money while they exist.',
      'Before step 3, ./hb backup create --production backs up the data it replaces.',
    ].join('\n'),
  );
  return { ok: true, managed: true };
};

/**
 * Imports the Auth users of a backup that the project doesn't have, or all of them with
 * `overwrite`, after backing up the users it overwrites. Users with a password are left out,
 * because importing them needs the project's password hash settings.
 */
const restoreUsers = async (
  repoRoot: string,
  projectId: string,
  file: string,
  {
    overwrite,
    dryRun,
    yes,
    backup,
  }: { overwrite: boolean; dryRun: boolean; yes: boolean; backup?: string },
): Promise<CommandResult | false> => {
  const backedUp = readUsers(file);
  const temp = mkdtempSync(join(tmpdir(), 'hb-users-'));
  try {
    const currentFile = join(temp, 'current.json');
    await exportUsers(repoRoot, projectId, currentFile);
    const current = new Map(readUsers(currentFile).map((user) => [user.localId, user]));
    const withPassword = backedUp.filter(({ passwordHash }) => passwordHash);
    const candidates = backedUp.filter(({ passwordHash }) => !passwordHash);
    const there = candidates.filter(({ localId }) => current.has(localId));
    const toImport = overwrite
      ? candidates
      : candidates.filter(({ localId }) => !current.has(localId));
    console.log(
      `\nAuth users: ${toImport.length} to import, ${there.length} already in ${projectId}` +
        (overwrite ? ' (overwritten).' : ' (kept, --overwrite-users replaces them).'),
    );
    if (withPassword.length) {
      console.log(
        `! ${plural(withPassword.length, 'user')} with a password left out. Importing them needs ` +
          "the project's password hash settings, see docs/guides/backups.md.",
      );
    }
    const result = { imported: toImport.length, kept: overwrite ? 0 : there.length };
    if (!toImport.length) return { ok: true, users: result };
    if (dryRun) {
      console.log(`Dry run: would import ${plural(toImport.length, 'user')}. Nothing was written.`);
      return { ok: true, users: result };
    }
    if (
      !(await confirmChange(`Import ${plural(toImport.length, 'user')} into ${projectId}?`, yes))
    ) {
      return false;
    }

    let usersBackup: string | undefined;
    if (overwrite && there.length) {
      const folder = backup ? join(repoRoot, backup) : backupFolderFor(repoRoot).folder;
      addUsersToBackup(
        folder,
        there.map(({ localId }) => current.get(localId)!),
        {
          ...versions(repoRoot),
          projectId,
          createdAt: new Date().toISOString(),
          command: 'hb backup restore',
          scope: 'changes',
        },
      );
      usersBackup = shownPath(repoRoot, folder);
    }
    const importFile = join(temp, 'import.json');
    writeUsers(importFile, toImport);
    await importUsers(repoRoot, projectId, importFile);
    console.log(`✔ Imported ${plural(toImport.length, 'user')} into ${projectId}.`);
    if (usersBackup) {
      console.log(
        `  The users it overwrote are in ${usersBackup}. Undo with: ./hb backup restore ` +
          `${usersBackup} --production --overwrite-users`,
      );
    }
    return { ok: true, users: result, ...(usersBackup ? { usersBackup } : {}) };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
};

export interface RestoreOptions {
  dryRun?: boolean;
  yes?: boolean;
  /** Also restore the Auth users. On by default. */
  auth?: boolean;
  /** Replace the Auth users that exist, instead of only adding the missing ones. */
  overwriteUsers?: boolean;
}

/**
 * Restores a backup as it is, without migrations or checks. A backup of all the data replaces
 * the collections it has. A backup of changes writes back what changed, and deletes what the
 * change created. What the restore replaces is backed up first.
 */
export const runBackupRestore = async (
  backup: string,
  { dryRun = false, yes = false, auth = true, overwriteUsers = false }: RestoreOptions = {},
): Promise<CommandResult | false> => {
  const repoRoot = repoRootOf();
  const managed = MANAGED.exec(backup);
  if (managed) return managedSteps(backup, managed[1]!);

  const folder = findBackup(repoRoot, backup);
  const shown = shownPath(repoRoot, folder);
  const projectId = productionProjectId(repoRoot);
  const contents = readBackup(folder);
  const from = contents.manifest?.projectId;
  if (from && from !== (projectId ?? DEMO_PROJECT_ID)) {
    console.log(`! ${shown} is from ${from}. It restores into ${projectId ?? 'the emulator'}.`);
  }
  const result = await importDocuments(contents.documents, shown, {
    exact: true,
    replace: contents.scope === 'all',
    deletes: contents.created,
    dryRun,
    yes,
    command: 'hb backup restore',
  });
  if (!result) return false;

  const usersFile = contents.manifest?.auth && join(folder, contents.manifest.auth.file);
  if (!usersFile || !auth) return result;
  if (!projectId) {
    console.log(`! ${shown} has Auth users, which only restore to production.`);
    return result;
  }
  const users = await restoreUsers(repoRoot, projectId, usersFile, {
    overwrite: overwriteUsers,
    dryRun,
    yes,
    ...(typeof result['backup'] === 'string' ? { backup: result['backup'] } : {}),
  });
  return users && { ...result, ...users };
};

export interface ScheduleOptions {
  daily?: boolean;
  /** A day, such as `monday`, or `true` for Sunday. */
  weekly?: boolean | string;
  /** Days to keep each backup. */
  retention?: string;
  /** Turn on point-in-time recovery, which keeps 7 days of versions. */
  pitr?: boolean;
  /** Delete the schedules and turn point-in-time recovery off. */
  disable?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

/** The schedule the options ask for, or undefined for `--disable`. */
export const wantedSchedule = ({
  daily,
  weekly,
  retention,
  disable,
}: ScheduleOptions): { weekly?: string; retentionDays: number } | undefined => {
  if ([daily, weekly, disable].filter(Boolean).length !== 1) {
    throw new UsageError('Pick one of --daily, --weekly or --disable.');
  }
  if (disable) {
    if (retention) throw new UsageError('--retention only applies with --daily or --weekly.');
    return undefined;
  }
  const day = weekly === true ? 'SUNDAY' : weekly ? weekly.toUpperCase() : undefined;
  if (day && !DAYS.includes(day)) {
    throw new UsageError(`--weekly takes a day, such as monday. Got ${String(weekly)}.`);
  }
  const max = day ? MAX_RETENTION.weekly : MAX_RETENTION.daily;
  const days = retention === undefined ? (day ? 28 : 7) : Number(retention);
  if (!Number.isInteger(days) || days < 1 || days > max) {
    throw new UsageError(
      `--retention takes the days to keep each backup, from 1 to ${max} for ${day ? 'weekly' : 'daily'} backups.`,
    );
  }
  return { ...(day ? { weekly: day } : {}), retentionDays: days };
};

const matches = (schedule: BackupSchedule, wanted: { weekly?: string; retentionDays: number }) =>
  retentionDays(schedule) === wanted.retentionDays &&
  (wanted.weekly
    ? schedule.weeklyRecurrence?.day === wanted.weekly
    : Boolean(schedule.dailyRecurrence));

/**
 * Sets up scheduled backups of the production database, which Firestore keeps for the
 * retention. Keeps a schedule that already matches, and replaces the others.
 */
export const runBackupSchedule = async (
  options: ScheduleOptions,
): Promise<CommandResult | false> => {
  const wanted = wantedSchedule(options);
  const { pitr = false, dryRun = false, yes = false } = options;
  if (pitr && !wanted) throw new UsageError('--pitr only applies with --daily or --weekly.');
  const repoRoot = repoRootOf();
  const projectId = resolveFirebaseProjectId(repoRoot);
  if (!projectId) throw new UsageError('No Firebase project. Run ./hb init first.');

  // When the check itself fails, the Firebase CLI reports the problem below.
  if (wanted && !(await isBillingEnabled(repoRoot, projectId).catch(() => true))) {
    console.log(
      `✘ ${projectId} is on the Spark plan. Scheduled backups need the Blaze plan: ` +
        `https://console.firebase.google.com/project/${projectId}/usage/details`,
    );
    return false;
  }

  const [schedules, pitrOn] = await Promise.all([
    listSchedules(repoRoot, projectId),
    pitrEnabled(repoRoot, projectId),
  ]);
  const keep = wanted && schedules.find((schedule) => matches(schedule, wanted));
  const remove = schedules.filter((schedule) => schedule !== keep);
  const create = wanted && !keep ? wanted : undefined;
  const pitrChange = wanted ? (pitr && !pitrOn ? true : undefined) : pitrOn ? false : undefined;

  console.log(`Backups of ${projectId}:`);
  if (keep) console.log(`  Keep: ${describeSchedule(keep)}`);
  for (const schedule of remove) console.log(`  Delete: ${describeSchedule(schedule)}`);
  if (create) {
    console.log(
      `  Create: ${describeSchedule({
        name: '',
        retention: `${create.retentionDays * 86_400}s`,
        ...(create.weekly ? { weeklyRecurrence: { day: create.weekly } } : { dailyRecurrence: {} }),
      })}`,
    );
  }
  if (pitrChange !== undefined) {
    console.log(`  Point-in-time recovery: turn ${pitrChange ? 'on' : 'off'}`);
  } else if (pitrOn) {
    console.log('  Point-in-time recovery: on');
  }
  const result = {
    ok: true,
    projectId,
    created: create ? 1 : 0,
    deleted: remove.length,
    ...(pitrChange === undefined ? {} : { pitr: pitrChange }),
    dryRun,
  };
  if (!create && !remove.length && pitrChange === undefined) {
    console.log('✔ Nothing to change.');
    return result;
  }
  if (dryRun) {
    console.log('\nDry run: nothing was changed.');
    return result;
  }
  if (
    !(await confirmChange(
      `\nChange the backups of ${projectId}? Backups and point-in-time recovery are billed for storage.`,
      yes,
    ))
  ) {
    return false;
  }
  // Firestore allows one daily and one weekly schedule, so the old one goes first.
  for (const schedule of remove) await deleteSchedule(repoRoot, projectId, schedule.name);
  if (create) await createSchedule(repoRoot, projectId, create);
  if (pitrChange !== undefined) await setPitr(repoRoot, projectId, pitrChange);
  console.log(`\n✔ Changed the backups of ${projectId}. ./hb backup list --production shows them.`);
  return result;
};
