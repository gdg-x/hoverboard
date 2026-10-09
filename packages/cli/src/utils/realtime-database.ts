import { listDatabaseInstances } from '../lib/database-instances.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Realtime Database';

/** Whether listing failed because the project never turned on the Realtime Database API. */
const apiDisabled = (error: unknown): boolean => {
  const original = (error as { original?: unknown }).original;
  const text = [error, original].map((e) => (e instanceof Error ? e.message : String(e))).join(' ');
  return /SERVICE_DISABLED|has not been used in project/i.test(text);
};

const list = (names: string[]) => names.join(', ');
const is = (names: unknown[]) => (names.length === 1 ? 'is' : 'are');

/**
 * Warns when the project has an active Realtime Database. Hoverboard no longer uses one, and
 * deploys no longer set its rules. A disabled database serves no data, so it passes.
 */
export const checkRealtimeDatabase = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }

  let instances;
  try {
    instances = await listDatabaseInstances(repoRoot, projectId);
  } catch (error) {
    if (apiDisabled(error)) return { name, ok: true, message: 'None, as Hoverboard expects.' };
    const reason = error instanceof Error ? error.message : String(error);
    return {
      name,
      ok: true,
      warning: true,
      message: `Could not list the Realtime Database instances of ${projectId}: ${reason}`,
    };
  }

  const active = instances.filter(({ state }) => state === 'ACTIVE').map((i) => i.name);
  const disabled = instances.filter(({ state }) => state === 'DISABLED').map((i) => i.name);
  if (active.length) {
    return {
      name,
      ok: true,
      warning: true,
      message:
        `${list(active)} ${is(active)} active in ${projectId}, but Hoverboard no longer uses the ` +
        'Realtime Database, and deploys no longer set its rules. Export any data you still need, ' +
        'then disable or delete it in the Firebase console: ' +
        `https://console.firebase.google.com/project/${projectId}/database`,
    };
  }
  if (disabled.length) {
    const serves = disabled.length === 1 ? 'it serves' : 'they serve';
    return {
      name,
      ok: true,
      message: `${list(disabled)} ${is(disabled)} disabled, so ${serves} no data.`,
    };
  }
  return { name, ok: true, message: 'None, as Hoverboard expects.' };
};
