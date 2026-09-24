import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';

const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
const DEFAULT_PROJECT_ID = 'demo-hoverboard';

const repoRoot = findRepoRoot(process.cwd());
if (!repoRoot) {
  throw new Error('Could not find the repository root (no ancestor directory contains .git).');
}

const serviceAccountPath = join(repoRoot, 'serviceAccount.json');

/**
 * These commands target the local Firestore emulator by default, so running
 * them can never accidentally read or write production data. Pass
 * `FIRESTORE_TARGET=production` (see the `firestore-*:production` package
 * scripts) to explicitly connect to production Firestore instead, using
 * credentials from `serviceAccount.json`.
 */
if (process.env['FIRESTORE_TARGET'] === 'production') {
  if (!existsSync(serviceAccountPath)) {
    throw new Error(
      'serviceAccount.json not found. Add it to the project root to connect to production ' +
        'Firestore (see docs/tutorials/02-firebase.md).',
    );
  }
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
} else {
  // The Admin SDK routes all requests to the Firestore emulator, without
  // validating credentials, whenever FIRESTORE_EMULATOR_HOST is set.
  process.env['FIRESTORE_EMULATOR_HOST'] ??= DEFAULT_EMULATOR_HOST;
  initializeApp({ projectId: resolveFirebaseProjectId(repoRoot) ?? DEFAULT_PROJECT_ID });
}

export { repoRoot };
export const firestore = getFirestore();
