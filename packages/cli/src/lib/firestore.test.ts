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

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
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
    delete process.env['FIRESTORE_TARGET'];
    delete process.env['FIRESTORE_EMULATOR_HOST'];
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    const firestoreModule = await import('./firestore.js');

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-hoverboard' });
    expect(process.env['FIRESTORE_EMULATOR_HOST']).toBe('127.0.0.1:8080');
    expect(firestoreModule.repoRoot).toBe(repoRoot);
    expect(getFirestore).toHaveBeenCalled();
  });

  it('does not override an already-set FIRESTORE_EMULATOR_HOST', async () => {
    const repoRoot = makeRepoRoot();
    delete process.env['FIRESTORE_TARGET'];
    process.env['FIRESTORE_EMULATOR_HOST'] = '10.0.0.1:9999';
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await import('./firestore.js');

    expect(process.env['FIRESTORE_EMULATOR_HOST']).toBe('10.0.0.1:9999');
  });

  it('ignores the selected Firebase project', async () => {
    const repoRoot = makeRepoRoot();
    delete process.env['FIRESTORE_TARGET'];
    process.env['GCLOUD_PROJECT'] = 'my-production-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await import('./firestore.js');

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-hoverboard' });
  });
});

describe('lib/firestore (production target)', () => {
  it('signs in as the Firebase CLI account to the selected project', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_TARGET'] = 'production';
    process.env['GCLOUD_PROJECT'] = 'prod';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
    const mockCredential = { fake: 'credential' };
    vi.mocked(applicationDefault).mockReturnValue(mockCredential as never);

    await import('./firestore.js');

    expect(useFirebaseLoginCredentials).toHaveBeenCalledWith(repoRoot);
    expect(initializeApp).toHaveBeenCalledWith({ credential: mockCredential, projectId: 'prod' });
  });

  it('throws when no Firebase project is selected', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_TARGET'] = 'production';
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await expect(import('./firestore.js')).rejects.toThrow('No Firebase project is selected');
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('throws when nobody is signed in', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_TARGET'] = 'production';
    process.env['GCLOUD_PROJECT'] = 'prod';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
    vi.mocked(useFirebaseLoginCredentials).mockRejectedValue(new Error('Not logged in'));

    await expect(import('./firestore.js')).rejects.toThrow('Not logged in');
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('throws when no repository root can be found', async () => {
    const outsideRepo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(outsideRepo);
    vi.spyOn(process, 'cwd').mockReturnValue(outsideRepo);

    await expect(import('./firestore.js')).rejects.toThrow('Could not find the repository root');
  });
});
