import { styleText } from 'node:util';
import { findRepoRoot, checkNodeVersion, type DoctorCheckResult } from '../utils/node-version.js';
import { checkApiKeys } from '../utils/api-keys.js';
import { checkBilling } from '../utils/billing.js';
import { checkFirebaseProject, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { checkFirestoreBackups } from '../utils/firestore-backups.js';
import { checkFunctions } from '../utils/functions.js';
import { checkRealtimeDatabase } from '../utils/realtime-database.js';
import { checkServiceAccountKeys } from '../utils/service-account-keys.js';
import { checkServiceAccounts } from '../utils/service-accounts.js';
import { checkSiteConfig } from '../utils/site-config.js';
import { checkGitHubDeploys } from './setup-github.js';

const interactive = () => Boolean(process.stdout.isTTY);

const CONCURRENCY = 4;

const color = (format: 'dim' | 'green' | 'red' | 'yellow', text: string): string =>
  interactive() ? styleText(format, text) : text;

const symbol = (check: DoctorCheckResult): string => {
  if (check.warning) return color('yellow', '!');
  return check.ok ? color('green', '✔') : color('red', '✘');
};

/**
 * Runs environment checks a developer needs before running or deploying the
 * site, printing a report and returning whether everything passed.
 */
export const runDoctor = async (): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  const projectId = repoRoot ? resolveFirebaseProjectId(repoRoot) : undefined;

  const pending: [label: string, run: () => DoctorCheckResult | Promise<DoctorCheckResult>][] = [
    ['Node.js version', () => checkNodeVersion(repoRoot)],
    ['Firebase project', () => checkFirebaseProject(repoRoot)],
    ['Service account keys', () => checkServiceAccountKeys(repoRoot)],
    ['Site config', () => checkSiteConfig(repoRoot)],
    ['Blaze plan', () => checkBilling(repoRoot, projectId)],
    ['Cloud Functions', () => checkFunctions(repoRoot, projectId)],
    ['Realtime Database', () => checkRealtimeDatabase(repoRoot, projectId)],
    ['GitHub deploys', () => checkGitHubDeploys(repoRoot, projectId)],
    ['Service accounts', () => checkServiceAccounts(repoRoot, projectId)],
    ['Browser API key', () => checkApiKeys(repoRoot, projectId)],
    ['Firestore backups', () => checkFirestoreBackups(repoRoot)],
  ];

  const results: (DoctorCheckResult | undefined)[] = pending.map(() => undefined);
  const started = pending.map(() => false);
  let printed = 0;
  let liveLines = 0;

  // Prints finished results in order, then one short line per check still running or waiting.
  const render = () => {
    if (liveLines) process.stdout.write(`\x1b[${liveLines}F\x1b[0J`);
    for (let check = results[printed]; check; check = results[++printed]) {
      console.log(`${symbol(check)} ${check.name}: ${check.message}`);
    }
    if (!interactive()) return;
    const live = pending.slice(printed).flatMap(([label], offset) => {
      const check = results[printed + offset];
      if (check) return [`${symbol(check)} ${label}`];
      return started[printed + offset] ? [color('dim', `… ${label}`)] : [];
    });
    for (const line of live) process.stdout.write(`${line}\n`);
    liveLines = live.length;
  };

  let next = 0;
  const worker = async () => {
    while (next < pending.length) {
      const index = next++;
      started[index] = true;
      render();
      results[index] = await pending[index]![1]();
      render();
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const checks = results as DoctorCheckResult[];

  const allOk = checks.every((check) => check.ok);
  console.log(
    allOk
      ? '\nAll checks passed.'
      : '\nSome checks failed. Fix the issues above before running or deploying Hoverboard.',
  );
  return allOk;
};
