import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDeploy } from './deploy.js';

const { runCommandMock, resolveFirebaseBinMock, confirmMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn(),
  resolveFirebaseBinMock: vi.fn(() => '/repo/node_modules/.bin/firebase'),
  confirmMock: vi.fn(),
}));

vi.mock('../lib/spawn.js', () => ({ runCommand: runCommandMock }));
vi.mock('../lib/firebase-cli.js', () => ({ resolveFirebaseBin: resolveFirebaseBinMock }));
vi.mock('../lib/prompt.js', () => ({ confirm: confirmMock }));

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
  process.env['GCLOUD_PROJECT'] = 'demo-project';
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

describe('runDeploy', () => {
  it('builds and deploys after confirmation', async () => {
    const repo = makeRepo();
    confirmMock.mockResolvedValue(true);
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('demo-project'));
    expect(runCommandMock).toHaveBeenNthCalledWith(1, 'npm', ['run', 'build'], repo);
    expect(runCommandMock).toHaveBeenNthCalledWith(
      2,
      '/repo/node_modules/.bin/firebase',
      ['deploy'],
      repo,
      { NODE_ENV: 'production' },
    );
    expect(result).toBe(true);
  });

  it('skips the confirmation prompt with --yes', async () => {
    makeRepo();
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy({ yes: true });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('aborts without building or deploying when the user declines', async () => {
    makeRepo();
    confirmMock.mockResolvedValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(runCommandMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('does not deploy when the build fails', async () => {
    makeRepo();
    confirmMock.mockResolvedValue(true);
    runCommandMock.mockReturnValueOnce(1);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(runCommandMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it('fails fast when doctor-style checks fail, without prompting', async () => {
    const repo = makeRepo();
    writeFileSync(join(repo, '.nvmrc'), '1\n'); // no real Node major version is "1"
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(runCommandMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
