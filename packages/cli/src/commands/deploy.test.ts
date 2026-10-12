import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTarget, target } from '../lib/target.js';
import { runDeploy } from './deploy.js';

const { runCommandMock, resolveFirebaseBinMock, confirmMock, useFirebaseLoginCredentialsMock } =
  vi.hoisted(() => ({
    runCommandMock: vi.fn(),
    resolveFirebaseBinMock: vi.fn(() => '/repo/node_modules/.bin/firebase'),
    confirmMock: vi.fn(),
    useFirebaseLoginCredentialsMock: vi.fn(),
  }));
const runDataCheckMock = vi.hoisted(() => vi.fn(async () => true));

vi.mock('./data-check.js', () => ({ runDataCheck: runDataCheckMock }));

vi.mock('../lib/spawn.js', () => ({ runCommand: runCommandMock }));
vi.mock('../lib/firebase-cli.js', () => ({ resolveFirebaseBin: resolveFirebaseBinMock }));
vi.mock('../lib/prompt.js', () => ({ confirmChange: confirmMock }));
vi.mock('../lib/google-cloud.js', () => ({
  useFirebaseLoginCredentials: useFirebaseLoginCredentialsMock,
}));

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

beforeEach(() => {
  confirmMock.mockImplementation(async (_question: string, yes?: boolean) => Boolean(yes));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setTarget('emulator');
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

const makeRepo = (features: Record<string, boolean> = {}): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ engines: { node: process.versions.node.split('.')[0] } }),
  );
  mkdirSync(join(dir, 'packages', 'web', 'defaults'), { recursive: true });
  mkdirSync(join(dir, 'packages', 'config'), { recursive: true });
  writeFileSync(
    join(dir, 'packages', 'web', 'defaults', 'site.json'),
    JSON.stringify({ features: { functions: true } }),
  );
  writeFileSync(join(dir, 'packages', 'config', 'site.json'), JSON.stringify({ features }));
  process.env['HOME'] = dir; // isolate from the real firebase-tools configstore
  process.env['GCLOUD_PROJECT'] = 'demo-project';
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

describe('runDeploy', () => {
  it("warns about the demo's leftovers, and deploys anyway", async () => {
    const repo = makeRepo();
    for (const dir of ['demo-config', 'config']) {
      mkdirSync(join(repo, 'packages', dir, 'public'), { recursive: true });
      writeFileSync(join(repo, 'packages', dir, 'public', 'hero.jpg'), 'demo photo');
    }
    confirmMock.mockResolvedValue(true);
    runCommandMock.mockReturnValue(0);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    const output = log.mock.calls.flat().join('\n');
    expect(output).toContain("! 1 thing(s) are still the demo's. Visitors will see them:");
    expect(output).toContain('packages/config/public/hero.jpg');
    expect(result).toBe(true);
  });

  it('checks the content in production first, and stops before the build on a problem', async () => {
    makeRepo();
    confirmMock.mockResolvedValue(true);
    runDataCheckMock.mockResolvedValueOnce(false);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(target()).toBe('production');
    expect(runDataCheckMock).toHaveBeenCalled();
    expect(runCommandMock).not.toHaveBeenCalled();
    expect(log.mock.calls.flat().join('\n')).toContain(
      'Fix the content above in the Firebase console, then deploy again.',
    );
    expect(result).toBe(false);
  });

  it('builds and deploys after confirmation', async () => {
    const repo = makeRepo();
    confirmMock.mockResolvedValue(true);
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('demo-project'), undefined);
    expect(useFirebaseLoginCredentialsMock).toHaveBeenCalledWith(repo);
    expect(runCommandMock).toHaveBeenNthCalledWith(1, 'npm', ['run', 'build'], repo, {
      FIRESTORE_TARGET: 'production',
    });
    expect(runCommandMock).toHaveBeenNthCalledWith(
      2,
      '/repo/node_modules/.bin/firebase',
      ['deploy', '--project', 'demo-project'],
      repo,
      { NODE_ENV: 'production' },
    );
    expect(result).toBe(true);
  });

  it('leaves out Cloud Functions when features.functions is false', async () => {
    const repo = makeRepo({ functions: false });
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runDeploy({ yes: true });

    expect(runCommandMock).toHaveBeenLastCalledWith(
      '/repo/node_modules/.bin/firebase',
      ['deploy', '--project', 'demo-project', '--except', 'functions'],
      repo,
      { NODE_ENV: 'production' },
    );
  });

  it('skips the confirmation prompt with --yes', async () => {
    makeRepo();
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy({ yes: true });

    expect(confirmMock).toHaveBeenCalledWith(expect.any(String), true);
    expect(result).toBe(true);
  });

  it('only shows where it would deploy with --dry-run', async () => {
    makeRepo({ functions: false });
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy({ dryRun: true });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(useFirebaseLoginCredentialsMock).not.toHaveBeenCalled();
    expect(runCommandMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenLastCalledWith(
      expect.stringContaining('firebase deploy --project demo-project --except functions'),
    );
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

  it('does not build without credentials to read Firestore', async () => {
    makeRepo();
    confirmMock.mockResolvedValue(true);
    useFirebaseLoginCredentialsMock.mockRejectedValueOnce(new Error('Run `firebase login`.'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(runCommandMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Run `firebase login`.'));
    expect(result).toBe(false);
  });

  it('fails fast when doctor-style checks fail, without prompting', async () => {
    const repo = makeRepo();
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ engines: { node: '1' } })); // no real Node major version is "1"
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await runDeploy();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(runCommandMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('refuses the demo config, unless HB_DEMO is true', async () => {
    const repo = makeRepo();
    rmSync(join(repo, 'packages/config/site.json'));
    mkdirSync(join(repo, 'packages/demo-config'));
    writeFileSync(join(repo, 'packages/demo-config/site.json'), '{}');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDeploy({ yes: true })).toBe(false);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('would deploy the demo site'));
    expect(runCommandMock).not.toHaveBeenCalled();

    process.env['HB_DEMO'] = 'true';
    runCommandMock.mockReturnValue(0);
    expect(await runDeploy({ yes: true })).toBe(true);
  });
});
