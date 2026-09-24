import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFirestoreExport } from './firestore-export.js';

const { runCommandMock, resolveFirebaseBinMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn(),
  resolveFirebaseBinMock: vi.fn(() => '/repo/node_modules/.bin/firebase'),
}));

vi.mock('../lib/spawn.js', () => ({ runCommand: runCommandMock }));
vi.mock('../lib/firebase-cli.js', () => ({ resolveFirebaseBin: resolveFirebaseBinMock }));

const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

describe('runFirestoreExport', () => {
  it('exports the running emulator data to .firebase/emulator-data', () => {
    const repo = makeRepo();
    runCommandMock.mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runFirestoreExport()).toBe(true);
    expect(runCommandMock).toHaveBeenCalledWith(
      '/repo/node_modules/.bin/firebase',
      ['emulators:export', './.firebase/emulator-data', '--only', 'firestore', '--force'],
      repo,
    );
  });

  it('fails fast when no repository root can be found', () => {
    const outsideRepo = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(outsideRepo);
    vi.spyOn(process, 'cwd').mockReturnValue(outsideRepo);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runFirestoreExport()).toBe(false);
    expect(runCommandMock).not.toHaveBeenCalled();
  });
});
