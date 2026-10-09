import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCommand } from '../../lib/spawn.js';
import { runConvertSchedule } from './index.js';

const writes = vi.hoisted(() => [] as { id: string; data: object; options: object }[]);
const root = vi.hoisted(() => ({ path: '' }));
const collections = vi.hoisted(() => ({}) as Record<string, Record<string, object>>);

vi.mock('../../lib/firestore.js', () => {
  const snapshot = (name: string) => ({
    docs: Object.entries(collections[name] ?? {}).map(([id, data]) => ({ id, data: () => data })),
  });
  return {
    get repoRoot() {
      return root.path;
    },
    firestore: {
      collection: (name: string) => ({
        get: async () => snapshot(name),
        doc: (id: string) => ({ id }),
      }),
      batch: () => ({
        set: (ref: { id: string }, data: object, options: object) =>
          writes.push({ id: ref.id, data, options }),
        commit: async () => undefined,
      }),
    },
  };
});
vi.mock('../../lib/spawn.js', () => ({ runCommand: vi.fn(() => 0) }));

const session = { title: 'Lunch', description: 'Food' };

beforeEach(() => {
  root.path = mkdtempSync(join(tmpdir(), 'convert-schedule-'));
  mkdirSync(join(root.path, 'packages', 'config'), { recursive: true });
  writeFileSync(
    join(root.path, 'packages', 'config', 'site.json'),
    JSON.stringify({ schedule: { published: true } }),
  );
  writes.length = 0;
  collections['sessions'] = { lunch: session, talk: { title: 'Talk', description: 'About' } };
  collections['schedule'] = {
    '2027-10-15': {
      tracks: [{ title: 'Main hall' }],
      timeslots: [
        { startTime: '10:00', endTime: '10:40', sessions: [{ items: ['talk'] }] },
        { startTime: '12:00', endTime: '13:00', sessions: [{ items: ['lunch'] }] },
      ],
    },
    '2027-10-16': {
      tracks: [{ title: 'Main hall' }],
      timeslots: [{ startTime: '12:30', endTime: '13:30', sessions: [{ items: ['lunch'] }] }],
    },
  };
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runConvertSchedule', () => {
  it('writes the times onto the sessions, copies, and the tracks to site.json', async () => {
    await runConvertSchedule();

    expect(writes).toEqual([
      {
        id: 'talk',
        data: { day: '2027-10-15', startTime: '10:00', endTime: '10:40' },
        options: { merge: true },
      },
      {
        id: 'lunch',
        data: { day: '2027-10-15', startTime: '12:00', endTime: '13:00' },
        options: { merge: true },
      },
      {
        id: 'lunch-2',
        data: { ...session, day: '2027-10-16', startTime: '12:30', endTime: '13:30' },
        options: { merge: false },
      },
    ]);
    const site = JSON.parse(
      readFileSync(join(root.path, 'packages', 'config', 'site.json'), 'utf8'),
    ) as unknown;
    expect(site).toEqual({
      schedule: { published: true, tracks: [{ id: 'main-hall', title: 'Main hall' }] },
    });
    expect(runCommand).toHaveBeenCalledTimes(0);
  });

  it('writes nothing in a dry run', async () => {
    const conversion = await runConvertSchedule({ dryRun: true });

    expect(Object.keys(conversion.copies)).toEqual(['lunch-2']);
    expect(writes).toEqual([]);
    expect(readFileSync(join(root.path, 'packages', 'config', 'site.json'), 'utf8')).not.toContain(
      'tracks',
    );
    expect(console.log).toHaveBeenCalledWith(
      'sessions/lunch-2, a copy of lunch: 2027-10-16 12:30–13:30, every track',
    );
  });

  it('writes nothing when a session would be invalid', async () => {
    collections['sessions'] = { ...collections['sessions'], talk: { title: 'Talk' } };

    await expect(runConvertSchedule()).rejects.toThrow('Invalid sessions/talk');
    expect(writes).toEqual([]);
  });
});
