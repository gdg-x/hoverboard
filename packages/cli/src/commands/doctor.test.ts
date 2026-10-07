import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDoctor } from './doctor.js';

const { isBillingEnabledMock } = vi.hoisted(() => ({ isBillingEnabledMock: vi.fn() }));

vi.mock('../lib/billing.js', () => ({ isBillingEnabled: isBillingEnabledMock }));

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
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(await runDoctor()).toBe(true);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('All checks passed.');
  });

  it('still passes, with a warning, when the project is not on the Blaze plan', async () => {
    const repo = makeRepo();
    writeEngines(repo, String(parseInt(process.versions.node, 10)));
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    isBillingEnabledMock.mockResolvedValue(false);
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
});
