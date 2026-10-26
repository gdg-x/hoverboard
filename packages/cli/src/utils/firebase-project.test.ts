import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SITE_CONFIG_PATH,
  checkFirebaseProject,
  demoDeployProblem,
  resolveFirebaseProjectId,
  siteConfigPath,
  siteUrl,
} from './firebase-project.js';

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

const makeRepo = (site?: object | string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  if (site !== undefined) {
    const path = join(dir, SITE_CONFIG_PATH);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, typeof site === 'string' ? site : JSON.stringify(site));
  }
  return dir;
};

describe('resolveFirebaseProjectId', () => {
  it('reads firebase.projectId from the site config', () => {
    delete process.env['GCLOUD_PROJECT'];
    const root = makeRepo({ firebase: { projectId: 'my-devfest' } });
    writeFileSync(join(root, '.firebaserc'), JSON.stringify({ projects: { default: 'from-rc' } }));

    expect(resolveFirebaseProjectId(root)).toBe('my-devfest');
  });

  it('lets GCLOUD_PROJECT override the site config', () => {
    process.env['GCLOUD_PROJECT'] = 'from-env';

    expect(resolveFirebaseProjectId(makeRepo({ firebase: { projectId: 'my-devfest' } }))).toBe(
      'from-env',
    );
  });

  it.each([
    ['there is no site config', undefined],
    ['the site config has no project ID', { shortName: 'DevFest' }],
    ['the site config is not valid JSON', '{'],
  ])('returns undefined when %s', (_, site) => {
    delete process.env['GCLOUD_PROJECT'];

    expect(resolveFirebaseProjectId(makeRepo(site))).toBeUndefined();
  });
});

describe('siteUrl', () => {
  beforeEach(() => {
    delete process.env['GCLOUD_PROJECT'];
  });

  it('reads url from the site config', () => {
    const root = makeRepo({ url: 'https://example.com/', firebase: { projectId: 'my-devfest' } });

    expect(siteUrl(root)).toBe('https://example.com/');
  });

  it("falls back to the project's .web.app address", () => {
    expect(siteUrl(makeRepo({ firebase: { projectId: 'my-devfest' } }))).toBe(
      'https://my-devfest.web.app/',
    );
  });

  it('returns undefined without a project', () => {
    expect(siteUrl(makeRepo({ shortName: 'DevFest' }))).toBeUndefined();
  });
});

describe('siteConfigPath', () => {
  it('uses packages/config once it has a site.json, else the demo', () => {
    const root = makeRepo();
    expect(siteConfigPath(root)).toBe('packages/demo-config/site.json');
    expect(demoDeployProblem(root)).toContain('would deploy the demo site');

    process.env['HB_DEMO'] = 'true';
    expect(demoDeployProblem(root)).toBeUndefined();

    delete process.env['HB_DEMO'];
    mkdirSync(join(root, 'packages/config'), { recursive: true });
    writeFileSync(join(root, SITE_CONFIG_PATH), '{}');
    expect(siteConfigPath(root)).toBe(SITE_CONFIG_PATH);
    expect(demoDeployProblem(root)).toBeUndefined();
  });
});

describe('checkFirebaseProject', () => {
  it('passes when the site config sets a project ID', () => {
    delete process.env['GCLOUD_PROJECT'];

    const result = checkFirebaseProject(makeRepo({ firebase: { projectId: 'my-devfest' } }));

    expect(result.ok).toBe(true);
    expect(result.message).toContain('my-devfest');
  });

  it('fails when no project ID resolves', () => {
    delete process.env['GCLOUD_PROJECT'];

    const result = checkFirebaseProject(makeRepo());

    expect(result.ok).toBe(false);
    expect(result.message).toContain('firebase.projectId');
  });

  it('fails when repoRoot is undefined', () => {
    delete process.env['GCLOUD_PROJECT'];

    expect(checkFirebaseProject(undefined).ok).toBe(false);
  });
});
