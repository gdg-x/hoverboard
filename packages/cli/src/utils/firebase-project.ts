import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import type { DoctorCheckResult } from './node-version.js';

const readJson = (path: string): Record<string, unknown> | undefined => {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

/**
 * Walks up from `startDir` looking for a `.firebaserc`, returning its
 * `projects.default` alias (or the sole alias, if only one is defined).
 */
const projectIdFromFirebaseRc = (startDir: string): string | undefined => {
  let dir = startDir;
  for (;;) {
    const rc = readJson(join(dir, '.firebaserc'));
    const projects = rc?.['projects'] as Record<string, string> | undefined;
    if (projects) {
      if (projects['default']) return projects['default'];
      const aliases = Object.values(projects);
      if (aliases.length === 1) return aliases[0];
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
};

/**
 * Walks up from `startDir` looking for a directory that the Firebase CLI has
 * recorded an "active project" for in its global configstore (written by
 * `firebase use <projectId>`).
 */
const projectIdFromFirebaseToolsConfigstore = (startDir: string): string | undefined => {
  const configstore = readJson(join(homedir(), '.config/configstore/firebase-tools.json'));
  const activeProjects = configstore?.['activeProjects'] as Record<string, string> | undefined;
  if (!activeProjects) return undefined;

  let dir = startDir;
  for (;;) {
    if (activeProjects[dir]) return activeProjects[dir];
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
};

/**
 * Resolves the active Firebase project id the same way the Firebase CLI
 * resolves it (env var, then `.firebaserc`, then `firebase use`'s
 * configstore), so `doctor` reports whether a deploy target is selected.
 */
export const resolveFirebaseProjectId = (repoRoot: string): string | undefined =>
  process.env['GCLOUD_PROJECT'] ||
  projectIdFromFirebaseRc(repoRoot) ||
  projectIdFromFirebaseToolsConfigstore(repoRoot);

export const checkFirebaseProject = (repoRoot: string | undefined): DoctorCheckResult => {
  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);

  if (!projectId) {
    return {
      name: 'Firebase project',
      ok: false,
      message:
        'No Firebase project selected. Run `firebase use <project-id>` (or `firebase use --add`).',
    };
  }

  return {
    name: 'Firebase project',
    ok: true,
    message: `Selected Firebase project: ${projectId}.`,
  };
};
