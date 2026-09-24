import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-admin/app');
vi.mock('firebase-admin/firestore');

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
  it('initializes with the resolved project id and sets FIRESTORE_EMULATOR_HOST', async () => {
    const repoRoot = makeRepoRoot();
    delete process.env['FIRESTORE_TARGET'];
    delete process.env['FIRESTORE_EMULATOR_HOST'];
    process.env['GCLOUD_PROJECT'] = 'demo-project';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    const firestoreModule = await import('./firestore.js');

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-project' });
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

  it('falls back to the demo project id when none resolves', async () => {
    const repoRoot = makeRepoRoot();
    delete process.env['FIRESTORE_TARGET'];
    delete process.env['GCLOUD_PROJECT'];
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await import('./firestore.js');

    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'demo-hoverboard' });
  });
});

describe('lib/firestore (production target)', () => {
  it('initializes with credentials from serviceAccount.json', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_TARGET'] = 'production';
    writeFileSync(join(repoRoot, 'serviceAccount.json'), JSON.stringify({ projectId: 'prod' }));
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
    const mockCredential = { fake: 'credential' };
    vi.mocked(cert).mockReturnValue(mockCredential as never);

    await import('./firestore.js');

    expect(cert).toHaveBeenCalledWith({ projectId: 'prod' });
    expect(initializeApp).toHaveBeenCalledWith({ credential: mockCredential });
  });

  it('throws when serviceAccount.json is missing', async () => {
    const repoRoot = makeRepoRoot();
    process.env['FIRESTORE_TARGET'] = 'production';
    vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);

    await expect(import('./firestore.js')).rejects.toThrow('serviceAccount.json not found');
  });

  it('throws when no repository root can be found', async () => {
    const outsideRepo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(outsideRepo);
    vi.spyOn(process, 'cwd').mockReturnValue(outsideRepo);

    await expect(import('./firestore.js')).rejects.toThrow('Could not find the repository root');
  });
});
