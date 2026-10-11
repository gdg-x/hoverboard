import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runDataImport } from './data-import.js';
import { inUse, runDataSeed } from './data-seed.js';

vi.mock('./data-import.js', () => ({ runDataImport: vi.fn(async () => ({ ok: true })) }));

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('inUse', () => {
  it('is in use while any feature of its collection is on', () => {
    expect(inUse('sessions/101', { schedule: false })).toBe(true);
    expect(inUse('sessions/101', { schedule: false, speakers: false })).toBe(false);
    expect(inUse('config/notifications', { notifications: false })).toBe(false);
    expect(inUse('config/migrations', {})).toBe(true);
    expect(inUse('things/a', { blog: false })).toBe(true);
  });
});

describe('runDataSeed', () => {
  it('imports the sample data, without the collections of features that are off', async () => {
    const result = await runDataSeed({ dryRun: true }, { blog: false, team: false });

    const [folder, options] = vi.mocked(runDataImport).mock.calls[0]!;
    expect(folder).toMatch(/docs[/\\]sample-data$/);
    expect(options).toMatchObject({ dryRun: true, command: 'hb data seed' });
    expect(options!.include!('blog/c4p')).toBe(false);
    expect(options!.include!('team/0/members/1')).toBe(false);
    expect(options!.include!('speakers/ada')).toBe(true);
    expect(console.log).toHaveBeenCalledWith(
      'Skipped the data of features that are off in packages/config/site.json: blog, team, ' +
        'team/*/members.',
    );
    expect(result).toEqual({ ok: true, skipped: ['blog', 'team', 'team/*/members'] });
  });
});
