import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DoctorCheckResult } from './node-version.js';

export const SITE_CONFIG_PATH = 'packages/config/site.json';

const projectIdFromSiteConfig = (repoRoot: string): string | undefined => {
  const path = join(repoRoot, SITE_CONFIG_PATH);
  if (!existsSync(path)) return undefined;
  try {
    const site = JSON.parse(readFileSync(path, 'utf8')) as { firebase?: { projectId?: unknown } };
    const projectId = site.firebase?.projectId;
    return typeof projectId === 'string' && projectId ? projectId : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Returns the production Firebase project: `firebase.projectId` in the site config. The
 * `GCLOUD_PROJECT` environment variable overrides it, as it does for the Firebase CLI.
 */
export const resolveFirebaseProjectId = (repoRoot: string): string | undefined =>
  process.env['GCLOUD_PROJECT'] || projectIdFromSiteConfig(repoRoot);

/** Local development always uses this project. `demo-` projects only exist in the emulators. */
export const DEMO_PROJECT_ID = 'demo-hoverboard';

export const checkFirebaseProject = (repoRoot: string | undefined): DoctorCheckResult => {
  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);

  if (!projectId) {
    return {
      name: 'Firebase project',
      ok: false,
      message: `No Firebase project. Set firebase.projectId in ${SITE_CONFIG_PATH}.`,
    };
  }

  return {
    name: 'Firebase project',
    ok: true,
    message: `Firebase project: ${projectId}.`,
  };
};
