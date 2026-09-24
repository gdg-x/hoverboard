import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCommand } from './spawn.js';

const { spawnSyncMock } = vi.hoisted(() => ({ spawnSyncMock: vi.fn() }));

vi.mock('child_process', () => ({ spawnSync: spawnSyncMock }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('runCommand', () => {
  it('spawns the command with inherited stdio and the given cwd', () => {
    spawnSyncMock.mockReturnValue({ status: 0 });

    const exitCode = runCommand('firebase', ['deploy'], '/repo');

    expect(spawnSyncMock).toHaveBeenCalledWith(
      'firebase',
      ['deploy'],
      expect.objectContaining({ cwd: '/repo', stdio: 'inherit' }),
    );
    expect(exitCode).toBe(0);
  });

  it('merges extraEnv on top of the current process env', () => {
    spawnSyncMock.mockReturnValue({ status: 0 });

    runCommand('firebase', ['deploy'], '/repo', { NODE_ENV: 'production' });

    const passedEnv = spawnSyncMock.mock.calls[0]?.[2]?.env;
    expect(passedEnv).toMatchObject({ ...process.env, NODE_ENV: 'production' });
  });

  it('returns 1 when the command exits with no status (e.g. killed by a signal)', () => {
    spawnSyncMock.mockReturnValue({ status: null });

    expect(runCommand('firebase', ['deploy'], '/repo')).toBe(1);
  });

  it('throws when the command could not be spawned', () => {
    spawnSyncMock.mockReturnValue({ error: new Error('ENOENT') });

    expect(() => runCommand('missing-binary', [], '/repo')).toThrow('ENOENT');
  });
});
