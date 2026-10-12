import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { useFirebaseLoginCredentials } from '../lib/google-cloud.js';
import { confirmChange } from '../lib/prompt.js';
import { runCommand } from '../lib/spawn.js';
import { setTarget } from '../lib/target.js';
import { demoLeftovers, formatLeftovers } from '../utils/demo-leftovers.js';
import {
  checkFirebaseProject,
  demoDeployProblem,
  resolveFirebaseProjectId,
} from '../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../utils/node-version.js';
import { firebaseDeployArgs } from '../utils/site-features.js';

export interface DeployOptions {
  /** Run the checks and show where it would deploy, without building or deploying. */
  dryRun?: boolean;
  yes?: boolean;
}

/**
 * Builds and deploys Hoverboard to the Firebase project in the site config,
 * asking for confirmation first since deploying to the wrong project is the
 * costliest mistake this CLI can help prevent.
 */
export const runDeploy = async (options: DeployOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const demo = repoRoot && demoDeployProblem(repoRoot);
  if (demo) {
    console.log(`✘ ${demo}`);
    return false;
  }
  const checks = [checkNodeVersion(repoRoot), checkFirebaseProject(repoRoot)];
  for (const check of checks) {
    console.log(`${check.ok ? '✔' : '✘'} ${check.name}: ${check.message}`);
  }

  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);
  if (!repoRoot || !projectId || checks.some((check) => !check.ok)) {
    console.log('\nFix the issues above before deploying (run `./hb doctor` for details).');
    return false;
  }

  const leftovers = demoLeftovers(repoRoot);
  if (leftovers.length) {
    console.log(`! ${leftovers.length} thing(s) are still the demo's. Visitors will see them:`);
    for (const line of formatLeftovers(leftovers)) console.log(line);
  }

  const extraArgs = firebaseDeployArgs(repoRoot);
  if (options.dryRun) {
    console.log(
      `\nDry run: would build from production Firestore, then run firebase deploy ` +
        `${['--project', projectId, ...extraArgs].join(' ')}.`,
    );
    return true;
  }

  if (
    !(await confirmChange(`\nDeploy Hoverboard to Firebase project "${projectId}"?`, options.yes))
  ) {
    console.log('Aborted.');
    return false;
  }

  try {
    await useFirebaseLoginCredentials(repoRoot);
  } catch (error) {
    console.log(`The build reads the site's content from Firestore. ${(error as Error).message}`);
    return false;
  }

  // The build fails on the same problems, but only after it starts.
  console.log('\nChecking the content...');
  setTarget('production');
  const { runDataCheck } = await import('./data-check.js');
  if (!(await runDataCheck())) {
    console.log(
      '\nFix the content above in the Firebase console, then deploy again. ' +
        '`./hb data check --production --fix` fixes some problems.',
    );
    return false;
  }

  console.log('\nBuilding...');
  if (runCommand('npm', ['run', 'build'], repoRoot, { FIRESTORE_TARGET: 'production' }) !== 0) {
    console.log('Build failed.');
    return false;
  }

  console.log('\nDeploying...');
  if (extraArgs.length) {
    console.log(
      'Skipping Cloud Functions: features.functions is false in packages/config/site.json.',
    );
  }
  const exitCode = runCommand(
    resolveFirebaseBin(repoRoot),
    ['deploy', '--project', projectId, ...extraArgs],
    repoRoot,
    { NODE_ENV: 'production' },
  );
  return exitCode === 0;
};
