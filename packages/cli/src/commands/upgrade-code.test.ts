import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCommand } from '../lib/spawn.js';
import {
  normalizeRepoUrl,
  runCodeUpgrade,
  runUpgradeAbort,
  runUpgradeContinue,
} from './upgrade-code.js';

vi.mock('../lib/spawn.js', () => ({ runCommand: vi.fn(() => 0), commandExists: () => false }));

type Files = Record<string, string | null>;

const run = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

/** Writes files, and deletes the ones set to null. */
const write = (root: string, files: Files) => {
  for (const [path, content] of Object.entries(files)) {
    const file = join(root, path);
    if (content === null) {
      rmSync(file);
      continue;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
};

const commit = (root: string, message: string, files: Files) => {
  write(root, files);
  run(root, 'add', '--all');
  run(root, 'commit', '--quiet', '-m', message);
};

const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`;
const read = (root: string, path: string) => readFileSync(join(root, path), 'utf8');

const changelog = (sections: string[]) => `# Changelog\n\n${sections.join('\n')}`;
const V410 = '## [4.1.0](compare) (2027-11-01)\n\n### ⚠ BREAKING CHANGES\n\n* rename a key\n';
const V400 = '## [4.0.0](compare) (2027-10-01)\n\n### Features\n\n* v4\n';

const RELEASE_400: Files = {
  'package.json': json({ name: 'hoverboard', version: '4.0.0' }),
  'CHANGELOG.md': changelog([V400]),
  'README.md': '# Hoverboard\n',
  '.github/dependabot.yml': 'version: 2\n',
  'packages/web/package.json': json({
    name: 'web',
    dependencies: { astro: '^7.0.0', lit: '^3.0.0' },
  }),
  'packages/web/package-lock.json': 'lock 4.0.0\n',
  'packages/web/src/app.ts': 'one\ntwo\nthree\n',
  'packages/demo-config/site.json': json({ shortName: 'Demo' }),
};

const RELEASE_410: Files = {
  'package.json': json({ name: 'hoverboard', version: '4.1.0' }),
  'CHANGELOG.md': changelog([V410, V400]),
  'README.md': '# Hoverboard 4.1\n',
  '.github/dependabot.yml': 'version: 2\nupdates: []\n',
  'packages/web/package.json': json({
    name: 'web',
    dependencies: { astro: '^7.1.0', lit: '^3.0.0' },
  }),
  'packages/web/package-lock.json': 'lock 4.1.0\n',
};

const FORK_CHANGES: Files = {
  'README.md': '# DevFest Lviv\n',
  '.github/dependabot.yml': null,
  'packages/config/site.json': json({ shortName: 'DevFest' }),
  'packages/web/package.json': json({
    name: 'web',
    dependencies: { astro: '^7.0.0', lit: '^3.1.0', widget: '^1.0.0' },
  }),
  'packages/web/package-lock.json': 'lock with widget\n',
};

let dirs: string[];
let upstream: string;
let fork: string;

/** Upstream with v4.0.0 and v4.1.0, and a fork of v4.0.0 with its own changes. */
const setUp = ({ release = RELEASE_410, forkChanges = FORK_CHANGES } = {}) => {
  upstream = mkdtempSync(join(tmpdir(), 'hoverboard-upstream-'));
  fork = mkdtempSync(join(tmpdir(), 'hoverboard-fork-'));
  dirs.push(upstream, fork);
  run(upstream, 'init', '--quiet', '--initial-branch=main');
  commit(upstream, 'feat: v4', RELEASE_400);
  run(upstream, 'tag', 'v4.0.0');
  run(fork, 'clone', '--quiet', upstream, '.');
  commit(fork, 'feat: our event', forkChanges);
  commit(upstream, 'feat: v4.1', release);
  run(upstream, 'tag', 'v4.1.0');
  vi.spyOn(process, 'cwd').mockReturnValue(fork);
};

const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');

beforeEach(() => {
  dirs = [];
  // Isolates git from the user's config, such as commit signing.
  vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
  vi.stubEnv('GIT_AUTHOR_NAME', 'Test');
  vi.stubEnv('GIT_AUTHOR_EMAIL', 'test@example.com');
  vi.stubEnv('GIT_COMMITTER_NAME', 'Test');
  vi.stubEnv('GIT_COMMITTER_EMAIL', 'test@example.com');
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

describe('normalizeRepoUrl', () => {
  it('matches the SSH and HTTPS URLs of a repository', () => {
    expect(normalizeRepoUrl('git@github.com:gdg-x/hoverboard.git')).toBe(
      'github.com/gdg-x/hoverboard',
    );
    expect(normalizeRepoUrl('https://github.com/gdg-x/Hoverboard')).toBe(
      'github.com/gdg-x/hoverboard',
    );
  });
});

describe('runCodeUpgrade', () => {
  it('merges the release on a branch, and resolves what it knows how to', async () => {
    setUp();

    const result = await runCodeUpgrade({ yes: true, upstreamUrl: upstream });

    expect(result).toMatchObject({
      ok: true,
      from: '4.0.0',
      to: '4.1.0',
      branch: 'upgrade/v4.1.0',
    });
    expect(run(fork, 'branch', '--show-current')).toBe('upgrade/v4.1.0');
    expect(run(fork, 'log', '-1', '--format=%s %p')).toMatch(
      /^chore: upgrade Hoverboard to v4.1.0 \w+ \w+$/,
    );
    expect(run(fork, 'status', '--porcelain')).toBe('');
    expect(JSON.parse(read(fork, 'packages/web/package.json'))).toEqual({
      name: 'web',
      dependencies: { astro: '^7.1.0', lit: '^3.0.0', widget: '^1.0.0' },
    });
    expect(read(fork, 'packages/web/package-lock.json')).toBe('lock 4.1.0\n');
    expect(read(fork, 'README.md')).toBe('# DevFest Lviv\n');
    expect(existsSync(join(fork, '.github/dependabot.yml'))).toBe(false);
    expect(JSON.parse(read(fork, 'package.json'))).toMatchObject({ version: '4.1.0' });
    expect(
      vi
        .mocked(runCommand)
        .mock.calls.map(([command, args, cwd]) => [command, args.join(' '), cwd]),
    ).toEqual([
      [
        'npm',
        'install --package-lock-only --ignore-scripts --no-audit --no-fund',
        join(fork, 'packages/web'),
      ],
      ['npm', 'ci', fork],
      [process.execPath, 'hb upgrade --migrations-only --no-data --yes', fork],
      ['npm', 'run build', fork],
    ]);
    expect(output()).toContain('Breaking changes:');
    expect(output()).toContain('packages/web/package.json: back to the release');
    expect(output()).toContain('README.md: kept yours');
    expect(output()).toContain('.github/dependabot.yml: you deleted it');
  });

  it('stops on a conflict, then continues once it is resolved', async () => {
    setUp({
      release: { ...RELEASE_410, 'packages/web/src/app.ts': 'one\nTWO\nthree\n' },
      forkChanges: { ...FORK_CHANGES, 'packages/web/src/app.ts': 'one\n2\nthree\n' },
    });

    expect(await runCodeUpgrade({ yes: true, upstreamUrl: upstream })).toBe(false);
    expect(output()).toContain('  packages/web/src/app.ts');
    expect(vi.mocked(runCommand)).not.toHaveBeenCalled();
    await expect(runCodeUpgrade({ yes: true, upstreamUrl: upstream })).rejects.toThrow(
      'An upgrade is in progress',
    );

    expect(await runUpgradeContinue({ yes: true })).toBe(false);
    write(fork, { 'packages/web/src/app.ts': 'one\nTWO and 2\nthree\n' });
    run(fork, 'add', 'packages/web/src/app.ts');

    expect(await runUpgradeContinue({ yes: true })).toMatchObject({ ok: true, to: '4.1.0' });
    expect(run(fork, 'log', '-1', '--format=%s')).toBe('chore: upgrade Hoverboard to v4.1.0');
  });

  it('goes back to where it started with abort', async () => {
    setUp({
      release: { ...RELEASE_410, 'packages/web/src/app.ts': 'one\nTWO\nthree\n' },
      forkChanges: { ...FORK_CHANGES, 'packages/web/src/app.ts': 'one\n2\nthree\n' },
    });
    const before = run(fork, 'rev-parse', 'HEAD');
    await runCodeUpgrade({ yes: true, upstreamUrl: upstream });

    expect(runUpgradeAbort()).toEqual({ ok: true, branch: 'main' });

    expect(run(fork, 'branch', '--show-current')).toBe('main');
    expect(run(fork, 'rev-parse', 'HEAD')).toBe(before);
    expect(run(fork, 'branch', '--list', 'upgrade/*')).toBe('');
    expect(run(fork, 'status', '--porcelain')).toBe('');
  });

  it('records the current release as merged in a repository without its history', async () => {
    setUp();
    // A repository made from the template: the same files, in a new history.
    rmSync(join(fork, '.git'), { recursive: true });
    run(fork, 'init', '--quiet', '--initial-branch=main');
    run(fork, 'add', '--all');
    run(fork, 'commit', '--quiet', '-m', 'Initial commit');

    expect(await runCodeUpgrade({ yes: true, upstreamUrl: upstream })).toMatchObject({ ok: true });

    expect(run(fork, 'remote')).toBe('upstream');
    expect(output()).toContain("Recording v4.0.0 as merged, since this repository doesn't share");
    expect(run(fork, 'log', '--format=%s')).toContain('chore: record Hoverboard v4.0.0 as merged');
    expect(JSON.parse(read(fork, 'packages/web/package.json'))['dependencies']).toEqual({
      astro: '^7.1.0',
      lit: '^3.0.0',
      widget: '^1.0.0',
    });
  });

  it('shows the release notes without changing anything in a dry run', async () => {
    setUp();

    expect(await runCodeUpgrade({ dryRun: true, upstreamUrl: upstream })).toMatchObject({
      dryRun: true,
    });

    expect(output()).toContain('* rename a key');
    expect(output()).toContain('packages/web/package.json (the release changes it too)');
    expect(output()).not.toContain('packages/config/site.json');
    expect(run(fork, 'branch', '--show-current')).toBe('main');
  });

  it('stops without changing anything on a dirty tree, or when there is nothing newer', async () => {
    setUp();
    write(fork, { 'notes.txt': 'draft' });
    expect(await runCodeUpgrade({ yes: true, upstreamUrl: upstream })).toBe(false);
    expect(output()).toContain('Commit or stash your changes first');

    rmSync(join(fork, 'notes.txt'));
    expect(await runCodeUpgrade({ version: '4.0.0', upstreamUrl: upstream })).toMatchObject({
      upToDate: true,
    });
    await expect(runCodeUpgrade({ version: '9.9.9', upstreamUrl: upstream })).rejects.toThrow(
      "There's no release v9.9.9",
    );
  });
});
