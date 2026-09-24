import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { runCommand } from '../lib/spawn.js';
import { findRepoRoot } from '../utils/node-version.js';

/** Starts the Firebase emulators, importing/exporting local Firestore data. */
export const runEmulators = (): boolean => {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    console.log('✘ Could not find the repository root (no ancestor directory contains .git).');
    return false;
  }

  const exitCode = runCommand(
    resolveFirebaseBin(repoRoot),
    ['emulators:start', '--import=./.firebase/emulator-data', '--export-on-exit'],
    repoRoot,
  );
  return exitCode === 0;
};
