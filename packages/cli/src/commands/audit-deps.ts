import { existsSync } from 'fs';
import { join } from 'path';
import { captureCommand } from '../lib/spawn.js';
import { findRepoRoot } from '../utils/node-version.js';

/** The directories with their own lockfile. */
export const AUDITED_PACKAGES = [
  '.',
  'packages/cli',
  'packages/server/functions',
  'packages/storage',
  'packages/web',
];

/** Advisories that don't apply to Hoverboard, and why. Remove each one once a fix is installed. */
export const ACCEPTED_ADVISORIES: Record<string, string> = {
  'https://github.com/advisories/GHSA-m9gg-hp2v-232j':
    "@grpc/grpc-js through firebase: only affects gRPC servers' getAuthContext, and Hoverboard only runs clients.",
};

const FAILING_SEVERITIES = new Set(['high', 'critical']);

export interface Advisory {
  pkg: string;
  name: string;
  severity: string;
  title: string;
  url: string;
}

interface AuditReport {
  vulnerabilities?: Record<string, { via: (string | Omit<Advisory, 'pkg'>)[] }>;
}

/** The high and critical advisories in an `npm audit --json` report, once each. */
export const severeAdvisories = (pkg: string, report: AuditReport): Advisory[] => {
  const advisories = new Map<string, Advisory>();
  for (const { via } of Object.values(report.vulnerabilities ?? {})) {
    for (const advisory of via) {
      if (typeof advisory === 'string' || !FAILING_SEVERITIES.has(advisory.severity)) continue;
      const { name, severity, title, url } = advisory;
      advisories.set(url, { pkg, name, severity, title, url });
    }
  }
  return [...advisories.values()];
};

/**
 * Runs `npm audit` on the production dependencies of each package, and fails on high or critical
 * advisories that are not accepted.
 */
export const runAuditDeps = (): boolean => {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    console.log('✘ Could not find the repository root (no ancestor directory contains .git).');
    return false;
  }

  const found: Advisory[] = [];
  for (const pkg of AUDITED_PACKAGES) {
    const dir = join(repoRoot, pkg);
    if (!existsSync(join(dir, 'package-lock.json'))) continue;
    // `npm audit` exits with 1 when it finds anything, so read the report instead.
    const { stdout, stderr } = captureCommand('npm', ['audit', '--omit=dev', '--json'], dir);
    let report: AuditReport;
    try {
      report = JSON.parse(stdout) as AuditReport;
    } catch {
      console.log(`✘ ${pkg}: npm audit did not return a report.\n${stderr}`);
      return false;
    }
    found.push(...severeAdvisories(pkg, report));
  }

  const failing = found.filter(({ url }) => !(url in ACCEPTED_ADVISORIES));
  for (const { pkg, name, severity, title, url } of found) {
    const accepted = ACCEPTED_ADVISORIES[url];
    const line = `${pkg}: ${name} (${severity}) ${title} ${url}`;
    console.log(accepted ? `! Accepted ${line}\n  ${accepted}` : `✘ ${line}`);
  }
  const foundUrls = new Set(found.map(({ url }) => url));
  for (const url of Object.keys(ACCEPTED_ADVISORIES)) {
    if (!foundUrls.has(url))
      console.log(`! ${url} is no longer reported. Remove it from the list.`);
  }
  if (!failing.length) console.log('✔ No high or critical advisories in production dependencies.');
  return failing.length === 0;
};
