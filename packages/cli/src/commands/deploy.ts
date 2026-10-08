import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { useFirebaseLoginCredentials } from '../lib/google-cloud.js';
import { confirm } from '../lib/prompt.js';
import { runCommand } from '../lib/spawn.js';
import { checkFirebaseProject, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../utils/node-version.js';

export interface DeployOptions {
  yes?: boolean;
}

/**
 * Builds and deploys Hoverboard to the Firebase project in the site config,
 * asking for confirmation first since deploying to the wrong project is the
 * costliest mistake this CLI can help prevent.
 */
export const runDeploy = async (options: DeployOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const checks = [checkNodeVersion(repoRoot), checkFirebaseProject(repoRoot)];
  for (const check of checks) {
    console.log(`${check.ok ? '✔' : '✘'} ${check.name}: ${check.message}`);
  }

  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);
  if (!repoRoot || !projectId || checks.some((check) => !check.ok)) {
    console.log('\nFix the issues above before deploying (run `hoverboard doctor` for details).');
    return false;
  }

  if (!options.yes) {
    const proceed = await confirm(`\nDeploy Hoverboard to Firebase project "${projectId}"?`);
    if (!proceed) {
      console.log('Aborted.');
      return false;
    }
  }

  console.log('\nBuilding...');
  try {
    await useFirebaseLoginCredentials(repoRoot);
  } catch (error) {
    console.log(`The build reads the site's content from Firestore. ${(error as Error).message}`);
    return false;
  }
  if (runCommand('npm', ['run', 'build'], repoRoot, { FIRESTORE_TARGET: 'production' }) !== 0) {
    console.log('Build failed.');
    return false;
  }

  console.log('\nDeploying...');
  const exitCode = runCommand(
    resolveFirebaseBin(repoRoot),
    ['deploy', '--project', projectId],
    repoRoot,
    { NODE_ENV: 'production' },
  );
  return exitCode === 0;
};
