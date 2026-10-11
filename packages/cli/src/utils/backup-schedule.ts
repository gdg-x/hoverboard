import { describeSchedule, listSchedules } from '../lib/firebase-backups.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Scheduled backups';

/**
 * Warns when the production database has no backup schedule. Firestore only keeps backups on a
 * schedule, which needs the Blaze plan, so this never fails `doctor`.
 */
export const checkBackupSchedule = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }
  try {
    const schedules = await listSchedules(repoRoot, projectId);
    if (schedules.length) {
      return { name, ok: true, message: schedules.map(describeSchedule).join('; ') };
    }
    return {
      name,
      ok: true,
      warning: true,
      message:
        `None for ${projectId}. On the Blaze plan, \`./hb backup schedule --daily\` backs up ` +
        'Firestore every day. Without it, only `./hb backup create --production` backs it up.',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { name, ok: true, warning: true, message: `Could not list them: ${reason}` };
  }
};
