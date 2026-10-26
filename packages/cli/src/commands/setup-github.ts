import { spawnSync } from 'child_process';
import {
  defaultGitHubClient,
  isFirebaseWifError,
  parseGitHubRemote,
  plan,
  resolveContext,
  setup,
  status,
  type Change,
  type GitHubClient,
  type GoogleClient,
  type Options,
  type Plan,
  type StatusReport,
} from '@abraham/firebase-wif';
import { UsageError, type CommandResult } from '../lib/command.js';
import { createGoogleCloud } from '../lib/google-cloud.js';
import { confirmChange } from '../lib/prompt.js';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot, type DoctorCheckResult } from '../utils/node-version.js';

/**
 * Roles a deploy needs on top of the ones firebase-wif grants for the products in firebase.json.
 * No Firestore writes, Auth users or Storage objects.
 */
export const EXTRA_DEPLOY_ROLES = [
  // The build reads the site's content.
  'roles/datastore.viewer',
  // The job that runs scheduleNotifications.
  'roles/cloudscheduler.admin',
];

// Hoverboard reads the project from site.json, so .firebaserc needs no default.
const IGNORED_CHECKS = new Set<string>(['local.project-match']);

/** Where the Google Cloud and GitHub requests go. Tests pass fakes. */
export interface Clients {
  google?: (repoRoot: string, projectId: string) => Promise<GoogleClient>;
  /** `false` skips the GitHub changes, which are then printed to make by hand. */
  github?: () => Promise<GitHubClient | false>;
  sleep?: (ms: number) => Promise<void>;
}

/** GitHub with `GH_TOKEN`, `GITHUB_TOKEN` or the `gh` login, or `false` without any. */
const gitHubClient = async (): Promise<GitHubClient | false> => {
  try {
    return await defaultGitHubClient();
  } catch (error) {
    if (isFirebaseWifError(error, 'NO_GITHUB_CREDENTIALS')) return false;
    throw error;
  }
};

const deployOptions = async (
  repoRoot: string,
  projectId: string,
  repo: string,
  clients: Clients,
): Promise<Options> => {
  const { local } = await resolveContext({ cwd: repoRoot, project: projectId, repo });
  return {
    projectId,
    repo,
    google: await (clients.google ?? createGoogleCloud)(repoRoot, projectId),
    github: await (clients.github ?? gitHubClient)(),
    local,
    roles: EXTRA_DEPLOY_ROLES,
    // Reuses a setup from earlier versions, which set WIF_PROVIDER and DEPLOY_SERVICE_ACCOUNT.
    adopt: true,
    sleep: clients.sleep,
  };
};

const sentence = (text: string) =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}${/[.!?]$/.test(text) ? '' : '.'}`;

const hbFix = (fix: string) => fix.replaceAll('firebase-wif setup', './hb setup-github');

/** The warnings and failures that aren't a change setup would make, as sentences. */
const problems = (report: StatusReport): string[] => {
  const changed = new Set<string>(report.changes.map((change) => change.resource));
  return report.checks
    .filter(
      (check) =>
        (check.status === 'warn' || check.status === 'fail') &&
        !changed.has(check.id) &&
        !IGNORED_CHECKS.has(check.id),
    )
    .map(
      (check) => `${sentence(check.message)}${check.fix ? ` ${sentence(hbFix(check.fix))}` : ''}`,
    );
};

const printPlan = ({ context, changes, preflight }: Plan, dryRun: boolean) => {
  if (preflight.missingPermissions.length) {
    console.log(
      `✘ Your account is missing these permissions on ${context.projectId}: ` +
        `${preflight.missingPermissions.join(', ')}.`,
    );
    console.log('  Ask a project owner to run this command, or to grant you the Owner role.');
  }
  if (!changes.length) {
    console.log(`✔ ${context.repo} can deploy to ${context.projectId}.`);
    return;
  }
  for (const change of changes) {
    console.log(
      `• ${dryRun ? 'Would ' : ''}${change.description}${change.manual ? ' (by hand)' : ''}`,
    );
  }
};

const descriptions = (changes: Change[]) => changes.map((change) => change.description);

const printError = (error: unknown) => {
  console.log(`✘ ${error instanceof Error ? error.message : String(error)}`);
  if (isFirebaseWifError(error) && error.fix) console.log(`  ${hbFix(error.fix)}`);
};

export interface RunSetupGitHubOptions {
  repo?: string;
  /** The project to deploy to instead of the one in site.json, such as a new edition's. */
  project?: string;
  dryRun?: boolean;
  yes?: boolean;
}

/**
 * Lets GitHub Actions in the repository deploy to the project with Workload Identity Federation
 * instead of a service account key, with firebase-wif. Safe to re-run: it only changes what is
 * missing. A project, such as a new edition's, reuses the deploy account that the repository
 * variables already point at in another project.
 */
export const runSetupGitHub = async (
  options: RunSetupGitHubOptions = {},
  clients: Clients = {},
): Promise<CommandResult> => {
  const repoRoot = findRepoRoot(process.cwd());
  const projectId = options.project ?? (repoRoot && resolveFirebaseProjectId(repoRoot));
  if (!repoRoot || !projectId) {
    console.log('✘ No Firebase project. Set firebase.projectId in packages/config/site.json.');
    return { ok: false };
  }
  const repo = options.repo ?? githubRepoFromGit(repoRoot);
  if (!repo) {
    console.log('✘ Could not find the GitHub repository. Pass it with --repo owner/name.');
    return { ok: false };
  }

  console.log(
    `Configuring deploys from ${repo} to ${projectId}${options.dryRun ? ' (dry run)' : ''}.\n`,
  );
  try {
    const base = await deployOptions(repoRoot, projectId, repo, clients);
    if (options.dryRun) {
      const planned = await plan(base);
      printPlan(planned, true);
      return { ok: true, changes: descriptions(planned.changes) };
    }

    const result = await setup({
      ...base,
      onEvent: (event) => {
        if (event.type === 'change:done') console.log(`✔ ${sentence(event.change.description)}`);
      },
      confirm: async (planned) => {
        printPlan(planned, false);
        if (!planned.changes.length) return false;
        if (planned.changes.every((change) => change.manual)) return true;
        return confirmChange('\nApply these changes?', options.yes);
      },
    });
    if (result.cancelled) {
      if (result.plan.changes.length) console.log('Aborted.');
      return { ok: !result.plan.changes.length, changes: [] };
    }

    for (const change of result.manual) console.log(`! Do by hand: ${change.description}.`);
    for (const problem of problems(result.status)) console.log(`! ${problem}`);
    if (result.applied.length) console.log('\nIAM changes can take a few minutes to take effect.');
    return { ok: result.status.ok, changes: descriptions([...result.applied, ...result.manual]) };
  } catch (error) {
    if (error instanceof UsageError) throw error;
    printError(error);
    return { ok: false };
  }
};

/** Warns when GitHub Actions can't deploy to the project. Deploying from a laptop works without it. */
export const checkGitHubDeploys = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
  clients: Clients = {},
): Promise<DoctorCheckResult> => {
  const name = 'GitHub deploys';
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }
  const repo = githubRepoFromGit(repoRoot);
  if (!repo) {
    return {
      name,
      ok: true,
      warning: true,
      message: 'Skipped, the origin remote is not on GitHub.',
    };
  }

  try {
    const report = await status(await deployOptions(repoRoot, projectId, repo, clients));
    const messages = [
      ...(report.changes.length
        ? [
            `Run \`./hb setup-github\` so ${repo} can deploy to ${projectId}. Missing: ` +
              `${descriptions(report.changes).join('; ')}.`,
          ]
        : []),
      ...problems(report),
    ];
    if (!messages.length) {
      return { name, ok: true, message: `${repo} can deploy to ${projectId} without a key.` };
    }
    return { name, ok: true, warning: true, message: messages.join(' ') };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { name, ok: true, warning: true, message: `Could not check ${repo}: ${reason}` };
  }
};

/** Reads `owner/name` from the `origin` remote, for example `git@github.com:gdg-x/hoverboard.git`. */
export const githubRepoFromGit = (cwd: string): string | undefined => {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' });
  try {
    return parseGitHubRemote(result.stdout ?? '');
  } catch {
    // Not on github.com.
    return undefined;
  }
};
