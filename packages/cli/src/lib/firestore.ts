import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DEMO_PROJECT_ID, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { useFirebaseLoginCredentials } from './google-cloud.js';

const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';

const repoRoot = findRepoRoot(process.cwd());
if (!repoRoot) {
  throw new Error('Could not find the repository root (no ancestor directory contains .git).');
}

/**
 * These commands target the local Firestore emulator by default, so running
 * them can never accidentally read or write production data. Pass
 * `FIRESTORE_TARGET=production` (see the `firestore-*:production` package
 * scripts) to explicitly connect to the selected Firebase project instead,
 * signed in as the Firebase CLI's current account.
 */
if (process.env['FIRESTORE_TARGET'] === 'production') {
  const projectId = resolveFirebaseProjectId(repoRoot);
  if (!projectId) {
    throw new Error('No Firebase project is selected. Run `./hbd setup`.');
  }
  await useFirebaseLoginCredentials(repoRoot);
  initializeApp({ credential: applicationDefault(), projectId });
} else {
  // The Admin SDK routes all requests to the Firestore emulator, without
  // validating credentials, whenever FIRESTORE_EMULATOR_HOST is set.
  process.env['FIRESTORE_EMULATOR_HOST'] ??= DEFAULT_EMULATOR_HOST;
  initializeApp({ projectId: DEMO_PROJECT_ID });
}

export { repoRoot };
export const firestore = getFirestore();
