import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkNodeVersion, findRepoRoot, requiredNodeMajorVersion } from './node-version.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  return dir;
};

describe('findRepoRoot', () => {
  it('finds the ancestor directory containing .git', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.git'));
    const nested = join(root, 'a', 'b');
    mkdirSync(nested, { recursive: true });

    expect(findRepoRoot(nested)).toBe(root);
  });

  it('returns undefined when no ancestor contains .git', () => {
    const nested = join(makeTempDir(), 'a');
    mkdirSync(nested, { recursive: true });

    expect(findRepoRoot(nested)).toBeUndefined();
  });
});

describe('requiredNodeMajorVersion', () => {
  it('reads the major version from .nvmrc', () => {
    const root = makeTempDir();
    writeFileSync(join(root, '.nvmrc'), '22\n');

    expect(requiredNodeMajorVersion(root)).toBe(22);
  });

  it('accepts a leading "v" in .nvmrc', () => {
    const root = makeTempDir();
    writeFileSync(join(root, '.nvmrc'), 'v18.20.4');

    expect(requiredNodeMajorVersion(root)).toBe(18);
  });

  it('returns undefined when there is no .nvmrc', () => {
    expect(requiredNodeMajorVersion(makeTempDir())).toBeUndefined();
  });
});

describe('checkNodeVersion', () => {
  const runningMajor = Number(process.versions.node.split('.')[0]);

  it('passes when the running major version matches .nvmrc', () => {
    const root = makeTempDir();
    writeFileSync(join(root, '.nvmrc'), `${runningMajor}\n`);

    const result = checkNodeVersion(root);

    expect(result.ok).toBe(true);
    expect(result.message).toContain(String(runningMajor));
  });

  it('fails when the running major version does not match .nvmrc', () => {
    const root = makeTempDir();
    writeFileSync(join(root, '.nvmrc'), `${runningMajor + 1}\n`);

    const result = checkNodeVersion(root);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('nvm use');
  });

  it('fails when the required version cannot be determined', () => {
    expect(checkNodeVersion(undefined).ok).toBe(false);
    expect(checkNodeVersion(makeTempDir()).ok).toBe(false);
  });
});
