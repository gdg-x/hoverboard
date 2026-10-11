import { execFile } from 'child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSchedule,
  describeSchedule,
  listManagedBackups,
  listSchedules,
  pitrEnabled,
  retentionDays,
} from './firebase-backups.js';

vi.mock('child_process', () => ({ execFile: vi.fn() }));
vi.mock('./firebase-cli.js', () => ({
  resolveFirebaseBin: () => '/repo/node_modules/.bin/firebase',
}));

type Callback = (error: Error | null, stdout: string, stderr: string) => void;

/** What the Firebase CLI prints, and the arguments it got. */
const cli = (stdout: string, { stderr = '', fails = false } = {}) => {
  const calls: string[][] = [];
  vi.mocked(execFile).mockImplementation(((
    _file: string,
    args: string[],
    _options: unknown,
    callback: Callback,
  ) => {
    calls.push(args);
    callback(fails ? new Error('exit 1') : null, stdout, stderr);
  }) as unknown as typeof execFile);
  return calls;
};

const success = (result: unknown) => JSON.stringify({ status: 'success', result }, null, 2);

afterEach(() => {
  vi.clearAllMocks();
});

describe('the Firebase CLI calls', () => {
  it('pass the project and --json, and return the result', async () => {
    const schedules = [{ name: 's1', retention: '604800s', dailyRecurrence: {} }];
    const calls = cli(success(schedules));

    expect(await listSchedules('/repo', 'fest-2027')).toEqual(schedules);
    expect(calls[0]).toEqual([
      'firestore:backups:schedules:list',
      '--project',
      'fest-2027',
      '--json',
      '--non-interactive',
    ]);
  });

  it('read the result after anything else the CLI printed', async () => {
    cli(`Some notice\n${success({ backups: [{ name: 'b1' }] })}`);

    expect(await listManagedBackups('/repo', 'fest-2027')).toEqual([{ name: 'b1' }]);
  });

  it('create a weekly schedule with the day and the retention', async () => {
    const calls = cli(success({ name: 's1' }));

    await createSchedule('/repo', 'fest-2027', { weekly: 'MONDAY', retentionDays: 28 });

    expect(calls[0]!.slice(0, 7)).toEqual([
      'firestore:backups:schedules:create',
      '--recurrence',
      'WEEKLY',
      '--day-of-week',
      'MONDAY',
      '--retention',
      '28d',
    ]);
  });

  it('read whether point-in-time recovery is on', async () => {
    cli(success({ pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_ENABLED' }));

    expect(await pitrEnabled('/repo', 'fest-2027')).toBe(true);
  });

  it("throw the CLI's error", async () => {
    cli(JSON.stringify({ status: 'error', error: 'Billing is off.' }), { fails: true });
    await expect(listSchedules('/repo', 'fest-2027')).rejects.toThrow(
      'firebase firestore:backups:schedules:list failed: Billing is off.',
    );

    cli('', { stderr: 'command not found', fails: true });
    await expect(listSchedules('/repo', 'fest-2027')).rejects.toThrow('command not found');
  });
});

describe('describeSchedule', () => {
  it('says when the backups run and how long they are kept', () => {
    const weekly = { name: 's', retention: '2419200s', weeklyRecurrence: { day: 'SUNDAY' } };
    expect(retentionDays(weekly)).toBe(28);
    expect(describeSchedule(weekly)).toBe('weekly on sunday, kept 28 days');
    expect(describeSchedule({ name: 's', retention: '86400s', dailyRecurrence: {} })).toBe(
      'daily, kept 1 day',
    );
  });
});
