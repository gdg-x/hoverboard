import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirebaseLoginCredentials } from './google-cloud.js';

vi.mock('firebase-admin/app');
vi.mock('firebase-admin/firestore');
vi.mock('./google-cloud.js');

const dirsToClean: string[] = [];
const originalEnv = { ...process.env };
let production = false;

// Modules are reset before each test, so the target is set on the fresh copy the import reads.
const importFirestore = async () => {
  (await import('./target.js')).setTarget(production ? 'production' : 'emulator');
  return import('./firestore.js');
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  production = false;
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

// Points HOME at an empty temp dir so firebase-tools' real configstore (if
// any exists on the machine running the tests) can never leak in.
const makeRepoRoot = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  process.env['HOME'] = dir;
  return dir;
};

describe('lib/firestore (emulator target, the default)', () => {
  it('initializes with the demo project and sets FIRESTORE_EMULATOR_HOST', async () => {
    const repoRoot = makeRepoRoot();
    delete process.env['FIRESTORE_EMULATOR_HOST'];
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    const firestoreModule = await importFirestore();

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-hoverboard' });
    expect(process.env['FIRESTORE_EMULATOR_HOST']).toBe('127.0.0.1:8080');
    expect(firestoreModule.repoRoot).toBe(repoRoot);
    expect(getFirestore).toHaveBeenCalled();
  });

  it('does not override an already-set FIRESTORE_EMULATOR_HOST', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_EMULATOR_HOST'] = '10.0.0.1:9999';
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await importFirestore();

    expect(process.env['FIRESTORE_EMULATOR_HOST']).toBe('10.0.0.1:9999');
  });

  it('ignores the selected Firebase project', async () => {
    const repoRoot = makeRepoRoot();
    process.env['GCLOUD_PROJECT'] = 'my-production-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await importFirestore();

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-hoverboard' });
  });
});

describe('lib/firestore (production target)', () => {
  it('signs in as the Firebase CLI account to the selected project', async () => {
    const repoRoot = makeRepoRoot();
    production = true;
    process.env['GCLOUD_PROJECT'] = 'prod';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
    const mockCredential = { fake: 'credential' };
    vi.mocked(applicationDefault).mockReturnValue(mockCredential as never);

    await importFirestore();

    expect(useFirebaseLoginCredentials).toHaveBeenCalledWith(repoRoot);
    expect(initializeApp).toHaveBeenCalledWith({ credential: mockCredential, projectId: 'prod' });
  });

  it('throws when no Firebase project is selected', async () => {
    const repoRoot = makeRepoRoot();
    production = true;
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await expect(importFirestore()).rejects.toThrow('No Firebase project. Set firebase.projectId');
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('throws when nobody is signed in', async () => {
    const repoRoot = makeRepoRoot();
    production = true;
    process.env['GCLOUD_PROJECT'] = 'prod';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
    vi.mocked(useFirebaseLoginCredentials).mockRejectedValue(new Error('Not logged in'));

    await expect(importFirestore()).rejects.toThrow('Not logged in');
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('throws when no repository root can be found', async () => {
    const outsideRepo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(outsideRepo);
    vi.spyOn(process, 'cwd').mockReturnValue(outsideRepo);

    await expect(importFirestore()).rejects.toThrow('Could not find the repository root');
  });
});
