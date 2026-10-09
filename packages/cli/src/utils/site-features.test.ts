import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { firebaseDeployArgs, functionsEnabled, siteFeatures } from './site-features.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeRepo = (defaults: object, site: object): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  for (const [path, json] of [
    ['packages/web/defaults/site.json', defaults],
    ['packages/config/site.json', site],
  ] as const) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), JSON.stringify(json));
  }
  return dir;
};

describe('siteFeatures', () => {
  it('reads the site features over the defaults', () => {
    const repo = makeRepo({ features: { blog: true, team: true } }, { features: { blog: false } });

    expect(siteFeatures(repo)).toEqual({ blog: false, team: true });
  });

  it('uses the defaults when the site has no features', () => {
    expect(siteFeatures(makeRepo({ features: { blog: true } }, {}))).toEqual({ blog: true });
  });

  it('reads the repository config', () => {
    expect(siteFeatures(REPO_ROOT)).toMatchObject({ blog: true, functions: true, speakers: true });
  });
});

describe('firebaseDeployArgs', () => {
  it('deploys everything while functions are on', () => {
    const repo = makeRepo({ features: { functions: true } }, {});

    expect(functionsEnabled(repo)).toBe(true);
    expect(firebaseDeployArgs(repo)).toEqual([]);
  });

  it('leaves out Cloud Functions when functions are off', () => {
    const repo = makeRepo({ features: { functions: true } }, { features: { functions: false } });

    expect(functionsEnabled(repo)).toBe(false);
    expect(firebaseDeployArgs(repo)).toEqual(['--except', 'functions']);
  });
});
