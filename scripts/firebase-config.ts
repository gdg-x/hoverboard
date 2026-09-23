// https://github.com/import-js/eslint-plugin-import/issues/1810

import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../serviceAccount.json');
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
const DEFAULT_PROJECT_ID = 'demo-hoverboard';

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
 * `projects.default` alias (or the sole alias, if only one is defined). This
 * mirrors how the Firebase CLI itself resolves the active project.
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
 * `firebase use <projectId>`), the same lookup `firebase emulators:start`
 * performs when no `--project` flag or `.firebaserc` is present.
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
 * Resolves the Firestore emulator project id the same way the Firebase CLI
 * resolves the active project for `firebase emulators:start` (no
 * `--project` flag), so admin scripts always read/write the same project
 * namespace the running emulator (and its UI) is serving. Falls back to a
 * fixed demo project id if no active project can be found.
 */
const resolveEmulatorProjectId = (): string => {
  const cwd = resolve(process.cwd());
  return (
    process.env['GCLOUD_PROJECT'] ||
    projectIdFromFirebaseRc(cwd) ||
    projectIdFromFirebaseToolsConfigstore(cwd) ||
    DEFAULT_PROJECT_ID
  );
};

/**
 * These scripts target the local Firestore emulator by default, so running
 * them can never accidentally read or write production data. Pass
 * `FIRESTORE_TARGET=production` (see the `firestore:*:production` npm
 * scripts) to explicitly connect to production Firestore instead, using
 * credentials from `serviceAccount.json`.
 */
if (process.env['FIRESTORE_TARGET'] === 'production') {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      'serviceAccount.json not found. Add it to the project root to connect to production ' +
        'Firestore (see docs/tutorials/02-firebase.md).',
    );
  }
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
} else {
  // The Admin SDK routes all requests to the Firestore emulator, without
  // validating credentials, whenever FIRESTORE_EMULATOR_HOST is set.
  process.env['FIRESTORE_EMULATOR_HOST'] ??= DEFAULT_EMULATOR_HOST;
  initializeApp({ projectId: resolveEmulatorProjectId() });
}

const firestore = getFirestore();

export { firestore };
