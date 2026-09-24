import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkFirebaseProject, resolveFirebaseProjectId } from './firebase-project.js';

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

const makeTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  return dir;
};

// Points HOME at an empty temp dir so firebase-tools' real configstore (if
// any exists on the machine running the tests) can never leak in.
const isolateHome = (): void => {
  process.env['HOME'] = makeTempDir();
};

describe('resolveFirebaseProjectId', () => {
  it('prefers GCLOUD_PROJECT over .firebaserc', () => {
    isolateHome();
    process.env['GCLOUD_PROJECT'] = 'from-env';
    const root = makeTempDir();
    writeFileSync(join(root, '.firebaserc'), JSON.stringify({ projects: { default: 'from-rc' } }));

    expect(resolveFirebaseProjectId(root)).toBe('from-env');
  });

  it("falls back to .firebaserc's default project", () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];
    const root = makeTempDir();
    writeFileSync(
      join(root, '.firebaserc'),
      JSON.stringify({ projects: { default: 'my-project', staging: 'other' } }),
    );

    expect(resolveFirebaseProjectId(root)).toBe('my-project');
  });

  it('falls back to the sole alias when there is no default', () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];
    const root = makeTempDir();
    writeFileSync(
      join(root, '.firebaserc'),
      JSON.stringify({ projects: { staging: 'only-project' } }),
    );

    expect(resolveFirebaseProjectId(root)).toBe('only-project');
  });

  it("reads an ancestor directory's .firebaserc", () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];
    const root = makeTempDir();
    writeFileSync(
      join(root, '.firebaserc'),
      JSON.stringify({ projects: { default: 'my-project' } }),
    );
    const nested = join(root, 'a', 'b');
    mkdirSync(nested, { recursive: true });

    expect(resolveFirebaseProjectId(nested)).toBe('my-project');
  });

  it('returns undefined when nothing resolves', () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];

    expect(resolveFirebaseProjectId(makeTempDir())).toBeUndefined();
  });
});

describe('checkFirebaseProject', () => {
  it('passes when a project id resolves', () => {
    isolateHome();
    process.env['GCLOUD_PROJECT'] = 'demo-project';

    const result = checkFirebaseProject(makeTempDir());

    expect(result.ok).toBe(true);
    expect(result.message).toContain('demo-project');
  });

  it('fails when no project id resolves', () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];

    const result = checkFirebaseProject(makeTempDir());

    expect(result.ok).toBe(false);
    expect(result.message).toContain('firebase use');
  });

  it('fails when repoRoot is undefined', () => {
    isolateHome();
    delete process.env['GCLOUD_PROJECT'];

    expect(checkFirebaseProject(undefined).ok).toBe(false);
  });
});
