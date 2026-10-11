import { execFile } from 'child_process';
import { resolveFirebaseBin } from './firebase-cli.js';

// Backups through the Firebase CLI: Firestore backup schedules and point-in-time recovery, and the
// Auth users, which the Admin SDK can list but not export with their password hashes. Also the
// (default) database, which a new edition creates in the location of the current one.

/** An Auth user, as `firebase auth:export --format=json` writes it. */
export interface AuthUser {
  localId: string;
  passwordHash?: string;
  [key: string]: unknown;
}

/** A Firestore backup schedule, as the Firestore Admin API returns it. */
export interface BackupSchedule {
  name: string;
  /** Seconds, such as `604800s`. */
  retention: string;
  dailyRecurrence?: Record<string, never>;
  weeklyRecurrence?: { day: string };
}

/** A backup that a schedule made. */
export interface ManagedBackup {
  name: string;
  snapshotTime?: string;
  expireTime?: string;
  state?: string;
  stats?: { sizeBytes?: string; documentCount?: string };
}

interface Database {
  locationId?: string;
  pointInTimeRecoveryEnablement?: string;
}

const PITR_ENABLED = 'POINT_IN_TIME_RECOVERY_ENABLED';
const DATABASE = '(default)';

/**
 * Runs a Firebase CLI command with `--json`, and returns its result. The CLI prints
 * `{status, result}` or `{status, error}` on stdout.
 */
const firebaseJson = <T>(repoRoot: string, projectId: string, args: string[]): Promise<T> =>
  new Promise((resolve, reject) => {
    execFile(
      resolveFirebaseBin(repoRoot),
      [...args, '--project', projectId, '--json', '--non-interactive'],
      { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const start = stdout.indexOf('{');
        let output: { status?: string; result?: T; error?: string } = {};
        try {
          output = JSON.parse(start === -1 ? stdout : stdout.slice(start)) as typeof output;
        } catch {
          // Not JSON, so the error is in stderr.
        }
        if (error || output.status !== 'success') {
          const message = output.error ?? (stderr.trim() || stdout.trim() || error?.message);
          reject(new Error(`firebase ${args[0]} failed: ${message}`));
        } else {
          resolve(output.result as T);
        }
      },
    );
  });

export const listSchedules = async (
  repoRoot: string,
  projectId: string,
): Promise<BackupSchedule[]> =>
  (await firebaseJson<BackupSchedule[] | undefined>(repoRoot, projectId, [
    'firestore:backups:schedules:list',
  ])) ?? [];

export const createSchedule = (
  repoRoot: string,
  projectId: string,
  { weekly, retentionDays }: { weekly?: string; retentionDays: number },
): Promise<BackupSchedule> =>
  firebaseJson(repoRoot, projectId, [
    'firestore:backups:schedules:create',
    '--recurrence',
    weekly ? 'WEEKLY' : 'DAILY',
    ...(weekly ? ['--day-of-week', weekly] : []),
    '--retention',
    `${retentionDays}d`,
  ]);

export const deleteSchedule = async (
  repoRoot: string,
  projectId: string,
  name: string,
): Promise<void> => {
  await firebaseJson(repoRoot, projectId, ['firestore:backups:schedules:delete', name, '--force']);
};

export const listManagedBackups = async (
  repoRoot: string,
  projectId: string,
): Promise<ManagedBackup[]> =>
  (
    await firebaseJson<{ backups?: ManagedBackup[] }>(repoRoot, projectId, [
      'firestore:backups:list',
    ])
  ).backups ?? [];

/** The location of the (default) database, such as `eur3`, or undefined when there is none. */
export const databaseLocation = async (
  repoRoot: string,
  projectId: string,
): Promise<string | undefined> => {
  try {
    return (
      await firebaseJson<Database>(repoRoot, projectId, ['firestore:databases:get', DATABASE])
    ).locationId;
  } catch {
    return undefined;
  }
};

/** Creates the (default) database. Its location can't change later. */
export const createDatabase = async (
  repoRoot: string,
  projectId: string,
  location: string,
): Promise<void> => {
  await firebaseJson(repoRoot, projectId, [
    'firestore:databases:create',
    DATABASE,
    '--location',
    location,
  ]);
};

/** Whether point-in-time recovery is on for the (default) database. */
export const pitrEnabled = async (repoRoot: string, projectId: string): Promise<boolean> =>
  (await firebaseJson<Database>(repoRoot, projectId, ['firestore:databases:get', DATABASE]))
    .pointInTimeRecoveryEnablement === PITR_ENABLED;

export const setPitr = async (repoRoot: string, projectId: string, on: boolean): Promise<void> => {
  await firebaseJson(repoRoot, projectId, [
    'firestore:databases:update',
    DATABASE,
    '--point-in-time-recovery',
    on ? 'ENABLED' : 'DISABLED',
  ]);
};

/** Writes every Auth user to a JSON file, `{users: [...]}`. Production only. */
export const exportUsers = async (
  repoRoot: string,
  projectId: string,
  file: string,
): Promise<void> => {
  await firebaseJson(repoRoot, projectId, ['auth:export', file, '--format=json']);
};

/** Imports the users in a JSON file. Users with a password need its hash settings, so leave them out. */
export const importUsers = async (
  repoRoot: string,
  projectId: string,
  file: string,
): Promise<void> => {
  await firebaseJson(repoRoot, projectId, ['auth:import', file]);
};

/** The retention in days, from the API's seconds. */
export const retentionDays = ({ retention }: BackupSchedule): number =>
  Math.round(Number.parseInt(retention, 10) / 86_400);

/** A schedule in a few words, such as `daily, kept 7 days`. */
export const describeSchedule = (schedule: BackupSchedule): string => {
  const days = retentionDays(schedule);
  const when = schedule.weeklyRecurrence
    ? `weekly on ${schedule.weeklyRecurrence.day.toLowerCase()}`
    : 'daily';
  return `${when}, kept ${days} day${days === 1 ? '' : 's'}`;
};

/** The Google Cloud console page with the database's backups and recovery settings. Verify the URL. */
export const consoleBackupsUrl = (projectId: string): string =>
  `https://console.cloud.google.com/firestore/databases/-default-/disaster-recovery?project=${projectId}`;
