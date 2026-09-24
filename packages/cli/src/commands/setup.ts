import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { runCommand } from '../lib/spawn.js';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../utils/node-version.js';
import { runDoctor } from './doctor.js';

/**
 * Interactively logs a new contributor in to Firebase and selects a project
 * for local development, automating the manual steps in
 * docs/tutorials/00-set-up.md.
 */
export const runSetup = async (): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    console.log('✘ Could not find the repository root (no ancestor directory contains .git).');
    return false;
  }

  const nodeCheck = checkNodeVersion(repoRoot);
  console.log(`${nodeCheck.ok ? '✔' : '✘'} ${nodeCheck.name}: ${nodeCheck.message}`);
  if (!nodeCheck.ok) {
    console.log('\nInstall the required Node.js version before continuing.');
    return false;
  }

  const firebaseBin = resolveFirebaseBin(repoRoot);

  console.log('\nLogging in to Firebase...');
  runCommand(firebaseBin, ['login'], repoRoot);

  if (resolveFirebaseProjectId(repoRoot)) {
    console.log('\n✔ A Firebase project is already selected.');
  } else {
    console.log('\nSelect a Firebase project...');
    runCommand(firebaseBin, ['use', '--add'], repoRoot);
  }

  console.log(
    '\nNext: run `npm start` in one terminal, then `npm run firestore:init` in another to ' +
      'seed the local Firestore emulator.',
  );

  return runDoctor();
};
