import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runSetup } from './setup.js';

const { runCommandMock, resolveFirebaseBinMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn(),
  resolveFirebaseBinMock: vi.fn(() => '/repo/node_modules/.bin/firebase'),
}));

vi.mock('../lib/spawn.js', () => ({ runCommand: runCommandMock }));
vi.mock('../lib/firebase-cli.js', () => ({ resolveFirebaseBin: resolveFirebaseBinMock }));
vi.mock('../lib/billing.js', () => ({ isBillingEnabled: vi.fn(async () => true) }));

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

const makeRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ engines: { node: process.versions.node.split('.')[0] } }),
  );
  process.env['HOME'] = dir; // isolate from the real firebase-tools configstore
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

describe('runSetup', () => {
  it('logs in and asks for a project ID when the site config has none', async () => {
    const repo = makeRepo();
    delete process.env['GCLOUD_PROJECT'];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runSetup();

    expect(runCommandMock).toHaveBeenCalledWith(
      '/repo/node_modules/.bin/firebase',
      ['login'],
      repo,
    );
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Set firebase.projectId');
    expect(existsSync(join(repo, '.firebaserc'))).toBe(false);
  });

  it('writes .firebaserc from the site config', async () => {
    const repo = makeRepo();
    delete process.env['GCLOUD_PROJECT'];
    mkdirSync(join(repo, 'packages/config'), { recursive: true });
    writeFileSync(
      join(repo, 'packages/config/site.json'),
      JSON.stringify({ firebase: { projectId: 'my-devfest' } }),
    );
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runSetup();

    expect(JSON.parse(readFileSync(join(repo, '.firebaserc'), 'utf8'))).toEqual({
      projects: { default: 'my-devfest' },
    });
  });

  it('bails out before logging in when the Node.js version is wrong', async () => {
    const repo = makeRepo();
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ engines: { node: '1' } })); // no real Node major version is "1"
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runSetup();

    expect(runCommandMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
