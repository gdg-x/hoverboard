import { writeFileSync } from 'fs';
import { join } from 'path';
import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { runCommand } from '../lib/spawn.js';
import { SITE_CONFIG_PATH, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../utils/node-version.js';
import { runDoctor } from './doctor.js';

/**
 * Interactively logs a new contributor in to Firebase and points the Firebase CLI at the
 * project in the site config, automating the manual steps in
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

  const projectId = resolveFirebaseProjectId(repoRoot);
  if (projectId) {
    // Lets plain `firebase` commands use the same project as `hbd`.
    writeFileSync(
      join(repoRoot, '.firebaserc'),
      `${JSON.stringify({ projects: { default: projectId } }, null, 2)}\n`,
    );
    console.log(`\n✔ Firebase project: ${projectId}.`);
  } else {
    console.log(`\n✘ Set firebase.projectId in ${SITE_CONFIG_PATH} to your Firebase project ID.`);
  }

  console.log(
    '\nNext: run `npm start` in one terminal, then `npm run firestore:init` in another to ' +
      'seed the local Firestore emulator.',
  );

  return runDoctor();
};
