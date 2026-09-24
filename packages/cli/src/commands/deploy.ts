import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { confirm } from '../lib/prompt.js';
import { runCommand } from '../lib/spawn.js';
import { checkFirebaseProject, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../utils/node-version.js';

export interface DeployOptions {
  yes?: boolean;
}

/**
 * Builds and deploys Hoverboard to the currently selected Firebase project,
 * asking for confirmation first since deploying to the wrong project is the
 * costliest mistake this CLI can help prevent.
 */
export const runDeploy = async (options: DeployOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const checks = [checkNodeVersion(repoRoot), checkFirebaseProject(repoRoot)];
  for (const check of checks) {
    console.log(`${check.ok ? '✔' : '✘'} ${check.name}: ${check.message}`);
  }

  if (!repoRoot || checks.some((check) => !check.ok)) {
    console.log('\nFix the issues above before deploying (run `hoverboard doctor` for details).');
    return false;
  }

  const projectId = resolveFirebaseProjectId(repoRoot);

  if (!options.yes) {
    const proceed = await confirm(`\nDeploy Hoverboard to Firebase project "${projectId}"?`);
    if (!proceed) {
      console.log('Aborted.');
      return false;
    }
  }

  console.log('\nBuilding...');
  if (runCommand('npm', ['run', 'build'], repoRoot) !== 0) {
    console.log('Build failed.');
    return false;
  }

  console.log('\nDeploying...');
  const exitCode = runCommand(resolveFirebaseBin(repoRoot), ['deploy'], repoRoot, {
    NODE_ENV: 'production',
  });
  return exitCode === 0;
};
