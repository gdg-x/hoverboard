import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { compareVersions, releaseNotes } from '../lib/changelog.js';
import { type CommandResult, UsageError } from '../lib/command.js';
import { fileAt, git, gitOutput, lines } from '../lib/git.js';
import { mergePackageJson } from '../lib/package-merge.js';
import { confirmChange } from '../lib/prompt.js';
import { commandExists, runCommand } from '../lib/spawn.js';
import { CONFIG_DIR } from '../utils/firebase-project.js';
import { confirmUpgradeTiming } from '../utils/event-week.js';
import { findRepoRoot } from '../utils/node-version.js';

export const UPSTREAM_URL = 'https://github.com/gdg-x/hoverboard.git';

// Files the upgrade keeps the fork's version of when both sides changed them.
const KEEP_OURS = (path: string) =>
  path === 'README.md' || path.startsWith('packages/web/public/images/');

const MAX_LISTED = 30;

interface UpgradeState {
  from: string;
  to: string;
  tag: string;
  branch: string;
  startBranch: string;
  /** Folders whose lockfile is the release's, to install the fork's dependencies into. */
  lockfiles: string[];
  /** What the upgrade resolved by itself, one line each. */
  resolved: string[];
}

export interface CodeUpgradeOptions {
  /** A release such as `4.2.0`. The latest by default. */
  version?: string;
  yes?: boolean;
  dryRun?: boolean;
  /** Where releases come from. Tests use a local repository. */
  upstreamUrl?: string;
}

const repoRootOf = () => findRepoRoot(process.cwd()) ?? process.cwd();

const statePath = (repoRoot: string) =>
  join(gitOutput(repoRoot, ['rev-parse', '--absolute-git-dir']), 'hb-upgrade.json');

const readState = (repoRoot: string): UpgradeState | undefined => {
  const path = statePath(repoRoot);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as UpgradeState) : undefined;
};

const saveState = (repoRoot: string, state: UpgradeState) =>
  writeFileSync(statePath(repoRoot), `${JSON.stringify(state, null, 2)}\n`);

const exists = (repoRoot: string, ref: string) =>
  git(repoRoot, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status === 0;

const rootVersion = (repoRoot: string) =>
  String(
    (JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as { version?: string })
      .version,
  );

/** A repository URL without its protocol and `.git`, so SSH and HTTPS URLs compare equal. */
export const normalizeRepoUrl = (url: string): string =>
  url
    .trim()
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/^[a-z+]+:\/\/(?:[^@/]+@)?/i, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
    .toLowerCase();

/** The remote that points at Hoverboard's repository, adding `upstream` when there is none. */
const upstreamRemote = (repoRoot: string, url: string): string => {
  for (const name of lines(gitOutput(repoRoot, ['remote']))) {
    const remoteUrl = gitOutput(repoRoot, ['remote', 'get-url', name]);
    if (normalizeRepoUrl(remoteUrl) === normalizeRepoUrl(url)) return name;
  }
  if (lines(gitOutput(repoRoot, ['remote'])).includes('upstream')) {
    throw new UsageError(
      `The upstream remote doesn't point at ${url}. Rename it, so the upgrade can add its own.`,
    );
  }
  gitOutput(repoRoot, ['remote', 'add', 'upstream', url]);
  console.log(`Added the upstream remote, ${url}.`);
  return 'upstream';
};

const latestRelease = (repoRoot: string): string | undefined =>
  lines(gitOutput(repoRoot, ['tag', '--list', 'v*']))
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
    .sort(compareVersions)
    .at(-1);

/** Paths with a merge conflict, with the stages they have: 1 base, 2 ours, 3 theirs. */
const unmerged = (repoRoot: string): Map<string, Set<number>> => {
  const stages = new Map<string, Set<number>>();
  for (const line of lines(gitOutput(repoRoot, ['ls-files', '--unmerged']))) {
    const [info, path] = line.split('\t') as [string, string];
    const stage = Number(info.split(' ')[2]);
    stages.set(path, (stages.get(path) ?? new Set()).add(stage));
  }
  return stages;
};

/**
 * Resolves what the upgrade knows how to: lockfiles and package.json files, files the fork
 * deleted, and the README and images, which keep the fork's version. Returns the conflicts left.
 */
const resolve = (repoRoot: string, state: UpgradeState, base: string): string[] => {
  const release = lines(gitOutput(repoRoot, ['diff', '--name-only', base, state.tag]));

  // Never merged as text: the release's lockfile, with the fork's dependencies installed later.
  for (const path of release.filter((file) => basename(file) === 'package-lock.json')) {
    if (fileAt(repoRoot, state.tag, path) === undefined) {
      gitOutput(repoRoot, ['rm', '--quiet', '--force', '--ignore-unmatch', '--', path]);
      continue;
    }
    gitOutput(repoRoot, ['checkout', state.tag, '--', path]);
    state.lockfiles.push(dirname(path));
    state.resolved.push(`${path}: the release's, with your dependencies added back`);
  }

  for (const path of release.filter((file) => basename(file) === 'package.json')) {
    const [from, mine, theirs] = [base, 'HEAD', state.tag].map((commit) =>
      fileAt(repoRoot, commit, path),
    );
    if (from === undefined || mine === undefined || theirs === undefined) continue;
    const { merged, conflicts, reverted } = mergePackageJson(
      JSON.parse(from) as Record<string, unknown>,
      JSON.parse(mine) as Record<string, unknown>,
      JSON.parse(theirs) as Record<string, unknown>,
    );
    if (conflicts.length) {
      state.resolved.push(`${path}: both sides changed ${conflicts.join(', ')}, so git merged it`);
      continue;
    }
    writeFileSync(join(repoRoot, path), `${JSON.stringify(merged, null, 2)}\n`);
    gitOutput(repoRoot, ['add', '--', path]);
    if (reverted.length) {
      state.resolved.push(`${path}: back to the release's tested versions: ${reverted.join(', ')}`);
    }
  }

  const left: string[] = [];
  for (const [path, stages] of unmerged(repoRoot)) {
    if (!stages.has(2) && stages.has(3)) {
      gitOutput(repoRoot, ['rm', '--quiet', '--', path]);
      state.resolved.push(`${path}: you deleted it, so it stays deleted`);
    } else if (stages.has(2) && KEEP_OURS(path)) {
      gitOutput(repoRoot, ['checkout', '--ours', '--', path]);
      gitOutput(repoRoot, ['add', '--', path]);
      state.resolved.push(`${path}: kept yours`);
    } else {
      left.push(path);
    }
  }
  return left;
};

/** Lists the fork's changes to Hoverboard's files, and marks the ones the release changes too. */
const printForkChanges = (repoRoot: string, from: string, tag: string) => {
  const own = (path: string) => path.startsWith(`${CONFIG_DIR}/`);
  const changed = lines(gitOutput(repoRoot, ['diff', '--name-only', from, 'HEAD'])).filter(
    (path) => !own(path),
  );
  if (!changed.length) return;
  const release = new Set(lines(gitOutput(repoRoot, ['diff', '--name-only', from, tag])));
  const both = changed.filter((path) => release.has(path));
  console.log(
    `Your changes to Hoverboard's files, outside ${CONFIG_DIR}: ${changed.length}, of which the ` +
      `release changes ${both.length} too.`,
  );
  for (const path of [...both, ...changed.filter((file) => !release.has(file))].slice(
    0,
    MAX_LISTED,
  )) {
    console.log(`  ${path}${release.has(path) ? ' (the release changes it too)' : ''}`);
  }
  if (changed.length > MAX_LISTED) console.log(`  and ${changed.length - MAX_LISTED} more`);
  console.log('');
};

const printConflicts = (left: string[]) => {
  console.log(`\n✘ ${left.length} files have conflicts the upgrade can't resolve:`);
  for (const path of left) console.log(`  ${path}`);
  console.log(
    '\nResolve them, `git add` them, then run ./hb upgrade --continue. ./hb upgrade --abort goes ' +
      'back to where you started.',
  );
};

const hasGh = () => commandExists('gh');

/** Installs, migrates, builds and commits a merged upgrade, then offers the pull request. */
const finish = async (
  repoRoot: string,
  state: UpgradeState,
  yes: boolean,
): Promise<CommandResult | false> => {
  const left = [...unmerged(repoRoot).keys()];
  if (left.length) {
    printConflicts(left);
    return false;
  }
  for (const dir of [...new Set(state.lockfiles)]) {
    console.log(`Adding your dependencies to ${join(dir, 'package-lock.json')}...`);
    const status = runCommand(
      'npm',
      ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
      join(repoRoot, dir),
    );
    if (status !== 0) {
      console.log(`✘ npm install failed in ${dir}. Fix it, then run ./hb upgrade --continue.`);
      return false;
    }
    gitOutput(repoRoot, ['add', '--', join(dir, 'package-lock.json')]);
  }
  const steps: [string, string, string[], Record<string, string>?][] = [
    ['Installing the dependencies', 'npm', ['ci']],
    // The release's own CLI runs the release's migrations.
    [
      'Running the config migrations',
      process.execPath,
      ['hb', 'upgrade', '--migrations-only', '--no-data', '--yes'],
    ],
    ['Building the site, without content', 'npm', ['run', 'build'], { FIRESTORE_TARGET: 'none' }],
  ];
  for (const [label, command, args, env] of steps) {
    console.log(`\n${label}...`);
    if (runCommand(command, args, repoRoot, env) !== 0) {
      console.log(`\n✘ ${label} failed. Fix it, then run ./hb upgrade --continue.`);
      return false;
    }
  }

  const title = `chore: upgrade Hoverboard to v${state.to}`;
  gitOutput(repoRoot, ['add', '--all']);
  gitOutput(repoRoot, ['commit', '--quiet', '-m', title]);
  rmSync(statePath(repoRoot), { force: true });

  console.log(`\n✔ Upgraded to v${state.to} on the branch ${state.branch}.`);
  for (const line of state.resolved) console.log(`  ${line}`);
  const next = [
    'Next:',
    '  - Check the site locally with npm start. ./hb upgrade --migrations-only migrates the data',
    "    in the emulators while they're running.",
    '  - Before merging, migrate production: ./hb upgrade --production --migrations-only --dry-run,',
    '    then without --dry-run.',
    '  - Merge the pull request with a merge commit, not a squash, so the next upgrade starts here.',
  ];
  console.log(`\n${next.join('\n')}`);

  const result = {
    ok: true,
    from: state.from,
    to: state.to,
    branch: state.branch,
    resolved: state.resolved,
  };
  const canAsk = yes || process.stdin.isTTY;
  if (!hasGh() || !canAsk) {
    console.log(
      `\nPush it and open a pull request: git push -u origin ${state.branch}, then gh pr create.`,
    );
    return result;
  }
  if (!(await confirmChange(`\nPush ${state.branch} and open a pull request?`, yes))) return result;
  gitOutput(repoRoot, ['push', '--quiet', '-u', 'origin', state.branch]);
  const body = [
    `Upgrades Hoverboard from v${state.from} to v${state.to}. See the release notes in CHANGELOG.md.`,
    '',
    ...(state.resolved.length
      ? ['Resolved by `hb upgrade`:', ...state.resolved.map((line) => `- ${line}`), '']
      : []),
    'Before merging, run the production data migrations:',
    '',
    '```console',
    './hb upgrade --production --migrations-only',
    '```',
    '',
    'Merge with a merge commit, not a squash, so the next upgrade starts from this release.',
  ].join('\n');
  if (
    runCommand(
      'gh',
      ['pr', 'create', '--head', state.branch, '--title', title, '--body', body],
      repoRoot,
    ) !== 0
  ) {
    console.log('✘ gh pr create failed. Open the pull request on GitHub.');
    return { ...result, ok: false };
  }
  return { ...result, pullRequest: true };
};

/**
 * Upgrades Hoverboard's code to a release: merges its tag into a new branch, resolves the files it
 * knows how to, then installs, migrates the config, builds and commits. Stops on other conflicts.
 */
export const runCodeUpgrade = async ({
  version,
  yes = false,
  dryRun = false,
  upstreamUrl = UPSTREAM_URL,
}: CodeUpgradeOptions = {}): Promise<CommandResult | false> => {
  const repoRoot = repoRootOf();
  if (readState(repoRoot)) {
    throw new UsageError(
      'An upgrade is in progress. Finish it with ./hb upgrade --continue, or go back with ' +
        './hb upgrade --abort.',
    );
  }
  if (gitOutput(repoRoot, ['status', '--porcelain'])) {
    console.log('✘ Commit or stash your changes first, so the upgrade starts from a clean tree.');
    return false;
  }
  if (!(await confirmUpgradeTiming(repoRoot, { yes, dryRun }))) return false;
  const from = rootVersion(repoRoot);
  if (compareVersions(from, '4.0.0') < 0) {
    console.log(
      `✘ This site is on v${from}. hb upgrade supports v4 and later. Sites from before v4 ` +
        'relaunch on v4, see docs/releases.md#supported-versions.',
    );
    return false;
  }

  const remote = upstreamRemote(repoRoot, upstreamUrl);
  console.log(`Fetching the releases from ${remote}...`);
  gitOutput(repoRoot, ['fetch', '--quiet', '--tags', remote]);
  const tag = version ? `v${version.replace(/^v/, '')}` : latestRelease(repoRoot);
  if (!tag || !exists(repoRoot, tag)) {
    throw new UsageError(`There's no release ${tag ?? ''}. Releases are tags such as v4.1.0.`);
  }
  const to = tag.slice(1);
  if (compareVersions(to, from) <= 0) {
    console.log(`✔ This site is on v${from}, and v${to} isn't newer.`);
    return { ok: true, from, to, upToDate: true };
  }

  const notes = releaseNotes(fileAt(repoRoot, tag, 'CHANGELOG.md') ?? '', from, to);
  console.log(`\nHoverboard v${from} to v${to}\n\n${notes || '(no release notes)'}\n`);
  const fromTag = `v${from}`;
  const hasFromTag = exists(repoRoot, fromTag);
  if (hasFromTag) printForkChanges(repoRoot, fromTag, tag);

  const branch = `upgrade/${tag}`;
  if (dryRun) {
    console.log(`Dry run: would merge ${tag} into a new branch, ${branch}.`);
    return { ok: true, from, to, dryRun: true };
  }
  if (exists(repoRoot, `refs/heads/${branch}`)) {
    throw new UsageError(`The branch ${branch} already exists. Delete it, or finish that upgrade.`);
  }
  if (exists(repoRoot, `refs/remotes/origin/${branch}`)) {
    console.log(`✔ ${branch} is already on origin. Merge or close its pull request first.`);
    return { ok: true, from, to, branch, pending: true };
  }
  if (!(await confirmChange(`Upgrade to v${to} on a new branch, ${branch}?`, yes))) return false;

  const startBranch = gitOutput(repoRoot, ['branch', '--show-current']);
  gitOutput(repoRoot, ['switch', '--quiet', '--create', branch]);
  if (hasFromTag && git(repoRoot, ['merge-base', '--is-ancestor', fromTag, 'HEAD']).status !== 0) {
    // Without it, the merge would start from an old base, or refuse unrelated histories.
    const related = git(repoRoot, ['merge-base', 'HEAD', fromTag]).status === 0;
    console.log(
      `Recording ${fromTag} as merged, since ${related ? 'an earlier upgrade was squashed' : "this repository doesn't share Hoverboard's history"}. ` +
        `Check the list of your changes above: the files must match ${fromTag} apart from them.`,
    );
    gitOutput(repoRoot, [
      'merge',
      '--quiet',
      '--strategy=ours',
      ...(related ? [] : ['--allow-unrelated-histories']),
      '-m',
      `chore: record Hoverboard ${fromTag} as merged`,
      fromTag,
    ]);
  }

  const state: UpgradeState = { from, to, tag, branch, startBranch, lockfiles: [], resolved: [] };
  const base = gitOutput(repoRoot, ['merge-base', 'HEAD', tag]);
  saveState(repoRoot, state);
  const merge = git(repoRoot, ['merge', '--no-commit', '--no-ff', tag]);
  if (merge.status !== 0 && !unmerged(repoRoot).size) {
    throw new Error(`git merge failed: ${(merge.stderr || merge.stdout).trim()}`);
  }
  const left = resolve(repoRoot, state, base);
  saveState(repoRoot, state);
  for (const line of state.resolved) console.log(`  ${line}`);
  if (left.length) {
    printConflicts(left);
    return false;
  }
  return finish(repoRoot, state, yes);
};

/** Finishes an upgrade after the organizer resolved its conflicts. */
export const runUpgradeContinue = async ({ yes = false } = {}): Promise<CommandResult | false> => {
  const repoRoot = repoRootOf();
  const state = readState(repoRoot);
  if (!state) throw new UsageError('No upgrade is in progress.');
  return finish(repoRoot, state, yes);
};

/** Goes back to the branch the upgrade started from, and deletes the upgrade's branch. */
export const runUpgradeAbort = (): CommandResult => {
  const repoRoot = repoRootOf();
  const state = readState(repoRoot);
  if (!state) throw new UsageError('No upgrade is in progress.');
  if (git(repoRoot, ['rev-parse', '--verify', '--quiet', 'MERGE_HEAD']).status === 0) {
    gitOutput(repoRoot, ['merge', '--abort']);
  }
  gitOutput(repoRoot, ['switch', '--quiet', state.startBranch]);
  gitOutput(repoRoot, ['branch', '--quiet', '-D', state.branch]);
  rmSync(statePath(repoRoot), { force: true });
  console.log(`✔ Back on ${state.startBranch}. Deleted ${state.branch}.`);
  return { ok: true, branch: state.startBranch };
};
