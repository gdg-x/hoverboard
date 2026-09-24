import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
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
  writeFileSync(join(dir, '.nvmrc'), `${process.versions.node.split('.')[0]}\n`);
  process.env['HOME'] = dir; // isolate from the real firebase-tools configstore
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

describe('runSetup', () => {
  it('logs in and prompts to select a project when none is selected', async () => {
    const repo = makeRepo();
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runSetup();

    expect(runCommandMock).toHaveBeenCalledWith(
      '/repo/node_modules/.bin/firebase',
      ['login'],
      repo,
    );
    expect(runCommandMock).toHaveBeenCalledWith(
      '/repo/node_modules/.bin/firebase',
      ['use', '--add'],
      repo,
    );
  });

  it('skips project selection when one is already resolved', async () => {
    makeRepo();
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runSetup();

    expect(runCommandMock).not.toHaveBeenCalledWith(
      expect.anything(),
      ['use', '--add'],
      expect.anything(),
    );
    expect(logSpy.mock.calls.flat().join('\n')).toContain('already selected');
  });

  it('bails out before logging in when the Node.js version is wrong', async () => {
    const repo = makeRepo();
    writeFileSync(join(repo, '.nvmrc'), '1\n'); // no real Node major version is "1"
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runSetup();

    expect(runCommandMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
