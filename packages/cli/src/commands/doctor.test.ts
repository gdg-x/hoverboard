import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { runDoctor } from './doctor.js';
import { EXPECTED_FUNCTIONS } from '../utils/functions.js';

const { isBillingEnabledMock, listDeployedFunctionsMock, listDatabaseInstancesMock } = vi.hoisted(
  () => ({
    isBillingEnabledMock: vi.fn(),
    listDeployedFunctionsMock: vi.fn(),
    listDatabaseInstancesMock: vi.fn(async () => []),
  }),
);

vi.mock('../lib/billing.js', () => ({ isBillingEnabled: isBillingEnabledMock }));
vi.mock('../lib/deployed-functions.js', () => ({
  listDeployedFunctions: listDeployedFunctionsMock,
}));
vi.mock('../lib/database-instances.js', () => ({
  listDatabaseInstances: listDatabaseInstancesMock,
}));

const gen2 = (id: string) => ({ id, region: 'us-central1', platform: 'gcfv2' });

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
  process.env['HOME'] = dir; // isolate from the real firebase-tools configstore
  return dir;
};

const writeEngines = (repo: string, node: string): void =>
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ engines: { node } }));

describe('runDoctor', () => {
  it('returns true and prints a success summary when every check passes', async () => {
    const repo = makeRepo();
    writeEngines(repo, String(parseInt(process.versions.node, 10)));
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    isBillingEnabledMock.mockResolvedValue(true);
    listDeployedFunctionsMock.mockResolvedValue(EXPECTED_FUNCTIONS.map(gen2));
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDoctor()).toBe(true);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('All checks passed.');
  });

  it('fails when a function is still 1st gen', async () => {
    const repo = makeRepo();
    writeEngines(repo, String(parseInt(process.versions.node, 10)));
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    isBillingEnabledMock.mockResolvedValue(true);
    listDeployedFunctionsMock.mockResolvedValue([
      ...EXPECTED_FUNCTIONS.slice(1).map(gen2),
      { ...gen2(EXPECTED_FUNCTIONS[0]!), platform: 'gcfv1' },
    ]);
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDoctor()).toBe(false);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('✘ Cloud Functions:');
  });

  it('still passes, with a warning, when the project is not on the Blaze plan', async () => {
    const repo = makeRepo();
    writeEngines(repo, String(parseInt(process.versions.node, 10)));
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    isBillingEnabledMock.mockResolvedValue(false);
    listDeployedFunctionsMock.mockResolvedValue([]);
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDoctor()).toBe(true);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('! Blaze plan:');
  });

  it('returns false and prints a failure summary when a check fails', async () => {
    const repo = makeRepo();
    writeEngines(repo, '1'); // no real Node major version is "1"
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDoctor()).toBe(false);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Some checks failed.');
  });

  it('shows running checks in a terminal, then replaces them with the results', async () => {
    const repo = makeRepo();
    writeEngines(repo, '1');
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: true });
    onTestFinished(() => {
      delete (process.stdout as { isTTY?: boolean }).isTTY;
    });
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((line: string) => output.push(`${line}\n`));

    await runDoctor();

    const text = output.join('');
    expect(text).toContain('\u2026 Node.js version');
    expect(text).toContain('\x1b[0J');
    expect(output.at(-2)).toContain('Browser API key:');
  });

  it('runs up to 4 checks at once, and prints the results in order', async () => {
    const repo = makeRepo();
    writeEngines(repo, String(parseInt(process.versions.node, 10)));
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    let finishBilling = (_enabled: boolean) => {};
    isBillingEnabledMock.mockReturnValue(new Promise((resolve) => (finishBilling = resolve)));
    listDeployedFunctionsMock.mockResolvedValue(EXPECTED_FUNCTIONS.map(gen2));
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const doctor = runDoctor();
    await vi.waitFor(() => expect(listDatabaseInstancesMock).toHaveBeenCalled());
    expect(logSpy.mock.calls.flat().join('\n')).not.toContain('Cloud Functions:');
    finishBilling(true);
    await doctor;

    const names = logSpy.mock.calls.flatMap(
      ([line]) => /^. ([^:]+):/.exec(String(line))?.[1] ?? [],
    );
    expect(names).toEqual([
      'Node.js version',
      'Firebase project',
      'Service account keys',
      'Site config',
      'Blaze plan',
      'Cloud Functions',
      'Realtime Database',
      'GitHub deploys',
      'Service accounts',
      'Browser API key',
    ]);
  });
});
