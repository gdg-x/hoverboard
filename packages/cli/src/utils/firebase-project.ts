import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DoctorCheckResult } from './node-version.js';

/** The site's own config, which `hb init` creates. */
export const CONFIG_DIR = 'packages/config';
export const DEMO_CONFIG_DIR = 'packages/demo-config';
export const SITE_CONFIG_PATH = `${CONFIG_DIR}/site.json`;

/** The config folder in use: packages/config once it has a site.json, else the demo's. */
export const siteConfigDir = (repoRoot: string): string =>
  existsSync(join(repoRoot, SITE_CONFIG_PATH)) ? CONFIG_DIR : DEMO_CONFIG_DIR;

/** The site.json in use, relative to the repository. */
export const siteConfigPath = (repoRoot: string): string => `${siteConfigDir(repoRoot)}/site.json`;

/**
 * Why a deploy must stop: without packages/config/site.json it would deploy the demo site.
 * Upstream, whose site is the demo, sets the HB_DEMO repository variable to `true`.
 */
export const demoDeployProblem = (repoRoot: string): string | undefined =>
  siteConfigDir(repoRoot) === DEMO_CONFIG_DIR && process.env['HB_DEMO'] !== 'true'
    ? `${SITE_CONFIG_PATH} doesn't exist, so this would deploy the demo site. Run ./hb init to ` +
      'create your config, then commit packages/config.'
    : undefined;

const projectIdFromSiteConfig = (repoRoot: string): string | undefined => {
  const path = join(repoRoot, siteConfigPath(repoRoot));
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
