import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { runCommand } from '../lib/spawn.js';
import { findRepoRoot } from '../utils/node-version.js';

/** Exports the running Firestore emulator's data to .firebase/emulator-data. */
export const runFirestoreExport = (): boolean => {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    console.log('✘ Could not find the repository root (no ancestor directory contains .git).');
    return false;
  }

  const exitCode = runCommand(
    resolveFirebaseBin(repoRoot),
    ['emulators:export', './.firebase/emulator-data', '--only', 'firestore', '--force'],
    repoRoot,
  );
  return exitCode === 0;
};
