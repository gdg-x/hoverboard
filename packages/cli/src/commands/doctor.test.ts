import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDoctor } from './doctor.js';

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  vi.restoreAllMocks();
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

describe('runDoctor', () => {
  it('returns true and prints a success summary when every check passes', () => {
    const repo = makeRepo();
    writeFileSync(join(repo, '.nvmrc'), `${process.versions.node.split('.')[0]}\n`);
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runDoctor()).toBe(true);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('All checks passed.');
  });

  it('returns false and prints a failure summary when a check fails', () => {
    const repo = makeRepo();
    writeFileSync(join(repo, '.nvmrc'), '1\n'); // no real Node major version is "1"
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runDoctor()).toBe(false);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Some checks failed.');
  });
});
