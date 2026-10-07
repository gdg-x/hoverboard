import { isBillingEnabled } from '../lib/billing.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Blaze plan';

/**
 * Warns when the selected Firebase project isn't on the Blaze plan, which
 * deploying Cloud Functions requires. Local development with the emulators
 * works without it, so this never fails `doctor`.
 */
export const checkBilling = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project selected.' };
  }

  try {
    if (await isBillingEnabled(repoRoot, projectId)) {
      return { name, ok: true, message: `Billing is enabled for ${projectId}.` };
    }
    return {
      name,
      ok: true,
      warning: true,
      message:
        `${projectId} is not on the Blaze plan, which deploying Cloud Functions requires. ` +
        `Upgrade at https://console.firebase.google.com/project/${projectId}/usage/details ` +
        'and set a spend cap (see docs/tutorials/02-firebase.md#billing).',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      name,
      ok: true,
      warning: true,
      message: `Could not check billing for ${projectId}: ${reason}`,
    };
  }
};
