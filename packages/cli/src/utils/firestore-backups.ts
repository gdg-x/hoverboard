import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { BACKUPS_PATH } from '../lib/firestore-fix.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Firestore backups';
const MAX_AGE_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/** The time of a backup from its folder name, such as `2026-10-09T12-30-00.000Z`. */
const backupTime = (folder: string): number | undefined => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2}(?:\.\d+)?)Z$/.exec(folder);
  return match ? Date.parse(`${match[1]}T${match[2]}:${match[3]}:${match[4]}Z`) : undefined;
};

/** Warns about backups in .firebase/backups older than 30 days, which can hold personal data. */
export const checkFirestoreBackups = (
  repoRoot: string | undefined,
  now = Date.now(),
): DoctorCheckResult => {
  const folder = repoRoot && join(repoRoot, BACKUPS_PATH);
  if (!folder || !existsSync(folder)) {
    return {
      name,
      ok: true,
      message: `No backups in ${BACKUPS_PATH}.`,
    };
  }
  const old = readdirSync(folder)
    .map((entry) => ({ entry, time: backupTime(entry) }))
    .filter(({ time }) => time !== undefined && now - time > MAX_AGE_DAYS * DAY)
    .sort((a, b) => a.time! - b.time!);
  if (!old.length) return { name, ok: true, message: `None older than ${MAX_AGE_DAYS} days.` };
  const commands = old.map(({ entry }) => `rm -r ${BACKUPS_PATH}/${entry}`).join('\n  ');
  return {
    name,
    ok: true,
    warning: true,
    message:
      `${old.length} ${old.length === 1 ? 'backup is' : 'backups are'} older than ${MAX_AGE_DAYS} days, ` +
      `the oldest from ${old[0]!.entry.slice(0, 10)}. They can hold personal data. Delete the ones you no longer need:\n  ${commands}`,
  };
};
