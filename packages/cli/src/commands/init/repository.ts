import { existsSync } from 'fs';
import { join } from 'path';
import { git, gitOutput, lines } from '../../lib/git.js';
import { ask, confirm } from '../../lib/prompt.js';
import { captureCommand, commandExists, runCommand } from '../../lib/spawn.js';
import { CONFIG_DIR } from '../../utils/firebase-project.js';
import { normalizeRepoUrl } from '../upgrade-code.js';

const UPSTREAM = 'github.com/gdg-x/hoverboard';
const DEPENDABOT = '.github/dependabot.yml';

export interface RepositoryOptions {
  /** The GitHub repository to create, such as `my-org/devfest`, or `false` to skip it. */
  repo?: string | false;
  /** The event's short name, for the default repository name. */
  shortName: string;
}

const originUrl = (repoRoot: string): string | undefined => {
  const { status, stdout } = git(repoRoot, ['remote', 'get-url', 'origin']);
  return status === 0 ? stdout.trim() : undefined;
};

const ghSignedIn = (repoRoot: string) =>
  commandExists('gh') && captureCommand('gh', ['auth', 'status'], repoRoot).status === 0;

export const repositoryName = (shortName: string): string =>
  shortName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'hoverboard';

const printSteps = () =>
  console.log(
    [
      '\nTo deploy from GitHub, put the site in your own repository:',
      '  1. Create an empty repository at https://github.com/new.',
      '  2. git remote rename origin upstream',
      '  3. git remote add origin <the new repository URL>',
      `  4. Commit ${CONFIG_DIR}, then git push -u origin HEAD`,
      '  5. ./hb setup-github',
    ].join('\n'),
  );

/**
 * Offers to delete Dependabot's config. It opens a pull request for each dependency update, which
 * conflict with the upgrade pull requests that already bring the versions upstream tested.
 */
const offerDependabotRemoval = async (repoRoot: string): Promise<boolean> => {
  if (!existsSync(join(repoRoot, DEPENDABOT))) return false;
  const remove = await confirm(
    `\nDelete ${DEPENDABOT}? Hoverboard's upgrade pull requests update the dependencies, and ` +
      "Dependabot's would conflict with them.",
  );
  if (remove) gitOutput(repoRoot, ['rm', '--quiet', DEPENDABOT]);
  return remove;
};

/** Commits the site's config, and the deleted Dependabot config, when they changed. */
const commitSite = (repoRoot: string, shortName: string, dependabot: boolean) => {
  const paths = [CONFIG_DIR, ...(dependabot ? [DEPENDABOT] : [])];
  // `git rm` already staged the deleted Dependabot config.
  gitOutput(repoRoot, ['add', '--all', '--', CONFIG_DIR]);
  if (git(repoRoot, ['diff', '--cached', '--quiet', '--', ...paths]).status === 0) return;
  gitOutput(repoRoot, ['commit', '--quiet', '-m', `chore: set up ${shortName}`, '--', ...paths]);
  console.log(`✔ Committed ${paths.join(' and ')}.`);
};

/**
 * Puts the site in the organizer's own GitHub repository. In a clone of Hoverboard, with the `gh`
 * CLI signed in, it offers to create a private repository, push to it, and run `hb setup-github`.
 * Without `gh`, it prints the steps. `ok` is false when a step failed.
 */
export const setUpRepository = async (
  repoRoot: string,
  { repo, shortName }: RepositoryOptions,
): Promise<{ ok: boolean; pushed: boolean }> => {
  const skipped = { ok: true, pushed: false };
  const origin = originUrl(repoRoot);
  if (origin && normalizeRepoUrl(origin) !== UPSTREAM) {
    if (await offerDependabotRemoval(repoRoot)) {
      console.log(`Commit the deleted ${DEPENDABOT}.`);
    }
    return skipped;
  }
  if (repo === false) return skipped;
  if (!ghSignedIn(repoRoot)) {
    printSteps();
    return skipped;
  }
  const name =
    repo ??
    ((await confirm('\nCreate a private GitHub repository for the site, and push it there?'))
      ? await ask('Repository name, or owner/name for an organization:', repositoryName(shortName))
      : undefined);
  if (!name) {
    printSteps();
    return skipped;
  }

  const dependabot = await offerDependabotRemoval(repoRoot);
  commitSite(repoRoot, shortName, dependabot);
  // Keeps Hoverboard as `upstream`, which `hb upgrade` merges releases from.
  const renamed = Boolean(origin) && !lines(gitOutput(repoRoot, ['remote'])).includes('upstream');
  if (origin) {
    gitOutput(
      repoRoot,
      renamed ? ['remote', 'rename', 'origin', 'upstream'] : ['remote', 'remove', 'origin'],
    );
  }
  const created = runCommand(
    'gh',
    ['repo', 'create', name, '--private', '--source', '.', '--remote', 'origin', '--push'],
    repoRoot,
  );
  if (created !== 0) {
    if (origin && !originUrl(repoRoot)) {
      gitOutput(
        repoRoot,
        renamed ? ['remote', 'rename', 'upstream', 'origin'] : ['remote', 'add', 'origin', origin],
      );
    }
    console.log(`✘ Couldn't create ${name} on GitHub.`);
    return { ok: false, pushed: false };
  }
  console.log(`✔ Pushed the site to ${name}. Letting its GitHub Actions deploy...`);
  const ok = runCommand(process.execPath, ['hb', 'setup-github', '--yes'], repoRoot) === 0;
  return { ok, pushed: true };
};
