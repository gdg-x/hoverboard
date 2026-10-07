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

const writeEngines = (root: string, node: string): void =>
  writeFileSync(join(root, 'package.json'), JSON.stringify({ engines: { node } }));

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
  it('reads the major version from engines.node in package.json', () => {
    const root = makeTempDir();
    writeEngines(root, '22');

    expect(requiredNodeMajorVersion(root)).toBe(22);
  });

  it('accepts a range in engines.node', () => {
    const root = makeTempDir();
    writeEngines(root, '>=18.20.4');

    expect(requiredNodeMajorVersion(root)).toBe(18);
  });

  it('returns undefined when package.json has no engines.node', () => {
    const root = makeTempDir();
    writeFileSync(join(root, 'package.json'), '{}');

    expect(requiredNodeMajorVersion(root)).toBeUndefined();
  });

  it('returns undefined when there is no package.json', () => {
    expect(requiredNodeMajorVersion(makeTempDir())).toBeUndefined();
  });
});

describe('checkNodeVersion', () => {
  const runningMajor = Number(process.versions.node.split('.')[0]);

  it('passes when the running major version matches engines.node', () => {
    const root = makeTempDir();
    writeEngines(root, String(runningMajor));

    const result = checkNodeVersion(root);

    expect(result.ok).toBe(true);
    expect(result.message).toContain(String(runningMajor));
  });

  it('fails when the running major version does not match engines.node', () => {
    const root = makeTempDir();
    writeEngines(root, String(runningMajor + 1));

    const result = checkNodeVersion(root);

    expect(result.ok).toBe(false);
    expect(result.message).toContain(`nvm install ${runningMajor + 1}`);
  });

  it('fails when the required version cannot be determined', () => {
    expect(checkNodeVersion(undefined).ok).toBe(false);
    expect(checkNodeVersion(makeTempDir()).ok).toBe(false);
  });
});
