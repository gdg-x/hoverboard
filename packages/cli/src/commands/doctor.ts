import { findRepoRoot, checkNodeVersion, type DoctorCheckResult } from '../utils/node-version.js';
import { checkFirebaseProject } from '../utils/firebase-project.js';

/**
 * Runs environment checks a developer needs before running or deploying the
 * site, printing a report and returning whether everything passed.
 */
export const runDoctor = (): boolean => {
  const repoRoot = findRepoRoot(process.cwd());

  const checks: DoctorCheckResult[] = [checkNodeVersion(repoRoot), checkFirebaseProject(repoRoot)];

  for (const check of checks) {
    console.log(`${check.ok ? '✔' : '✘'} ${check.name}: ${check.message}`);
  }

  const allOk = checks.every((check) => check.ok);
  console.log(
    allOk
      ? '\nAll checks passed.'
      : '\nSome checks failed. Fix the issues above before running or deploying Hoverboard.',
  );
  return allOk;
};
