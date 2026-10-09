import { findRepoRoot, checkNodeVersion, type DoctorCheckResult } from '../utils/node-version.js';
import { checkBilling } from '../utils/billing.js';
import { checkFirebaseProject, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkFunctions } from '../utils/functions.js';
import { checkServiceAccountKeys } from '../utils/service-account-keys.js';
import { checkSiteConfig } from '../utils/site-config.js';
import { checkGitHubDeploys } from './setup-github.js';

const symbol = (check: DoctorCheckResult): string => {
  if (check.warning) return '!';
  return check.ok ? '✔' : '✘';
};

/**
 * Runs environment checks a developer needs before running or deploying the
 * site, printing a report and returning whether everything passed.
 */
export const runDoctor = async (): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const projectId = repoRoot ? resolveFirebaseProjectId(repoRoot) : undefined;

  const checks: DoctorCheckResult[] = [
    checkNodeVersion(repoRoot),
    checkFirebaseProject(repoRoot),
    checkServiceAccountKeys(repoRoot),
    await checkSiteConfig(repoRoot),
    await checkBilling(repoRoot, projectId),
    await checkFunctions(repoRoot, projectId),
    await checkGitHubDeploys(repoRoot, projectId),
  ];

  for (const check of checks) {
    console.log(`${symbol(check)} ${check.name}: ${check.message}`);
  }

  const allOk = checks.every((check) => check.ok);
  console.log(
    allOk
      ? '\nAll checks passed.'
      : '\nSome checks failed. Fix the issues above before running or deploying Hoverboard.',
  );
  return allOk;
};
