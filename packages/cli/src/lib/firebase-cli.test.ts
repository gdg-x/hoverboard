import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveFirebaseBin } from './firebase-cli.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  return dir;
};

describe('resolveFirebaseBin', () => {
  it('resolves the firebase binary from the repo root node_modules/.bin', () => {
    const repoRoot = makeTempDir();
    const binDir = join(repoRoot, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    const expectedBinName = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
    writeFileSync(join(binDir, expectedBinName), '');

    expect(resolveFirebaseBin(repoRoot)).toBe(join(binDir, expectedBinName));
  });

  it('throws a helpful error when firebase-tools is not installed', () => {
    const repoRoot = makeTempDir();

    expect(() => resolveFirebaseBin(repoRoot)).toThrow('npm ci');
  });
});
