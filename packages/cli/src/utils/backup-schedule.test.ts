import { afterEach, describe, expect, it, vi } from 'vitest';
import { listSchedules } from '../lib/firebase-backups.js';
import { checkBackupSchedule } from './backup-schedule.js';

vi.mock('../lib/firebase-backups.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/firebase-backups.js')>()),
  listSchedules: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkBackupSchedule', () => {
  it('skips without a project', async () => {
    expect(await checkBackupSchedule('/repo', undefined)).toMatchObject({
      ok: true,
      warning: true,
    });
    expect(listSchedules).not.toHaveBeenCalled();
  });

  it('passes with a schedule', async () => {
    vi.mocked(listSchedules).mockResolvedValue([
      { name: 's', retention: '604800s', dailyRecurrence: {} },
    ]);

    const result = await checkBackupSchedule('/repo', 'fest-2027');

    expect(result).toEqual({ name: 'Scheduled backups', ok: true, message: 'daily, kept 7 days' });
  });

  it('warns without one, with the command that sets it up', async () => {
    vi.mocked(listSchedules).mockResolvedValue([]);

    const result = await checkBackupSchedule('/repo', 'fest-2027');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('./hb backup schedule --daily');
  });

  it('warns when the schedules can not be listed', async () => {
    vi.mocked(listSchedules).mockRejectedValue(new Error('Not logged in.'));

    const result = await checkBackupSchedule('/repo', 'fest-2027');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in.');
  });
});
