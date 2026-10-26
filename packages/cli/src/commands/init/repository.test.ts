import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repositoryName, setUpRepository } from './repository.js';

const mocks = vi.hoisted(() => ({
  ask: vi.fn(async (_question: string, defaultValue = '') => defaultValue),
  confirm: vi.fn(async (_question: string) => true),
  commandExists: vi.fn(() => true),
  captureCommand: vi.fn(() => ({ status: 0, stdout: '', stderr: '' })),
  runCommand: vi.fn((_command: string, _args: string[], _cwd: string) => 0),
}));

vi.mock('../../lib/prompt.js', () => ({ ask: mocks.ask, confirm: mocks.confirm }));
vi.mock('../../lib/spawn.js', () => ({
  commandExists: mocks.commandExists,
  captureCommand: mocks.captureCommand,
  runCommand: mocks.runCommand,
}));

const UPSTREAM = 'https://github.com/gdg-x/hoverboard.git';

// The commands under test run git with process.env, so the tests stub the same variables.
const env = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

let repo: string;
const run = (...args: string[]) =>
  execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  }).trim();
const write = (path: string, content: string) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), content);
};

beforeEach(() => {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-repo-'));
  run('init', '--quiet', '--initial-branch=main');
  write('README.md', 'Hoverboard');
  write('.github/dependabot.yml', 'version: 2');
  run('add', '.');
  run('commit', '--quiet', '-m', 'feat: v4');
  run('remote', 'add', 'origin', UPSTREAM);
  write('packages/config/site.json', '{}');
  write('notes.txt', 'not the site');
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  mocks.confirm.mockResolvedValue(true);
  mocks.commandExists.mockReturnValue(true);
  mocks.captureCommand.mockReturnValue({ status: 0, stdout: '', stderr: '' });
  mocks.runCommand.mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  rmSync(repo, { recursive: true, force: true });
});

describe('setUpRepository', () => {
  it('creates a private repository, pushes the site to it, and sets up deploys', async () => {
    const result = await setUpRepository(repo, { shortName: 'DevFest Lviv' });

    expect(result).toEqual({ ok: true, pushed: true });
    expect(mocks.ask).toHaveBeenCalledWith(
      expect.stringContaining('Repository name'),
      'devfest-lviv',
    );
    expect(run('remote', 'get-url', 'upstream')).toBe(UPSTREAM);
    expect(run('log', '-1', '--format=%s')).toBe('chore: set up DevFest Lviv');
    expect(run('show', '--name-status', '--format=', 'HEAD').split('\n').sort()).toEqual([
      'A\tpackages/config/site.json',
      'D\t.github/dependabot.yml',
    ]);
    expect(existsSync(join(repo, 'notes.txt'))).toBe(true);
    expect(mocks.runCommand).toHaveBeenCalledWith(
      'gh',
      [
        'repo',
        'create',
        'devfest-lviv',
        '--private',
        '--source',
        '.',
        '--remote',
        'origin',
        '--push',
      ],
      repo,
    );
    expect(mocks.runCommand).toHaveBeenLastCalledWith(
      process.execPath,
      ['hb', 'setup-github', '--yes'],
      repo,
    );
  });

  it('takes the repository name, and puts origin back when gh fails', async () => {
    mocks.confirm.mockResolvedValue(false);
    mocks.runCommand.mockReturnValueOnce(1);

    const result = await setUpRepository(repo, { repo: 'org/fest', shortName: 'Fest' });

    expect(result).toEqual({ ok: false, pushed: false });
    expect(mocks.ask).not.toHaveBeenCalled();
    expect(run('remote')).toBe('origin');
    expect(run('remote', 'get-url', 'origin')).toBe(UPSTREAM);
    expect(existsSync(join(repo, '.github/dependabot.yml'))).toBe(true);
  });

  it('prints the steps without gh', async () => {
    mocks.commandExists.mockReturnValue(false);

    expect(await setUpRepository(repo, { shortName: 'Fest' })).toEqual({ ok: true, pushed: false });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('https://github.com/new'));
    expect(mocks.runCommand).not.toHaveBeenCalled();
  });

  it('skips the repository with repo false', async () => {
    expect(await setUpRepository(repo, { repo: false, shortName: 'Fest' })).toEqual({
      ok: true,
      pushed: false,
    });
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("only offers to delete Dependabot's config in the site's own repository", async () => {
    run('remote', 'set-url', 'origin', 'git@github.com:org/fest.git');

    expect(await setUpRepository(repo, { shortName: 'Fest' })).toEqual({ ok: true, pushed: false });
    expect(existsSync(join(repo, '.github/dependabot.yml'))).toBe(false);
    expect(mocks.runCommand).not.toHaveBeenCalled();
  });
});

describe('repositoryName', () => {
  it('makes a repository name from the short name', () => {
    expect(repositoryName('#DevFest Lviv 2027!')).toBe('devfest-lviv-2027');
    expect(repositoryName('!!!')).toBe('hoverboard');
  });
});
