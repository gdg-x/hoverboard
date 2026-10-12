import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UsageError } from '../lib/command.js';
import { setTarget } from '../lib/target.js';
import { importDocuments, runDataImport } from './data-import.js';
import { inUse, runDataSeed, runStageSeed } from './data-seed.js';

vi.mock('./data-import.js', () => ({
  runDataImport: vi.fn(async () => ({ ok: true })),
  importDocuments: vi.fn(async () => ({ ok: true })),
}));

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  setTarget('emulator');
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');

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

describe('runStageSeed', () => {
  it("replaces the emulator's content with the fixture's", async () => {
    await runStageSeed('returning-live', { dryRun: true });

    const [documents, folder, options] = vi.mocked(importDocuments).mock.calls[0]!;
    expect(folder).toMatch(/docs[/\\]sample-data$/);
    expect(documents.some(({ path }) => path.startsWith('sessions/'))).toBe(true);
    expect(documents.some(({ path }) => path.startsWith('config/'))).toBe(false);
    expect(
      new Set(
        documents.flatMap(({ data }) => (typeof data['day'] === 'string' ? [data['day']] : [])),
      ),
    ).toEqual(new Set(['2017-10-13', '2017-10-14']));
    expect(options).toMatchObject({
      dryRun: true,
      replace: true,
      command: 'hb data seed --stage returning-live',
    });
    expect(options!.entries).toEqual(expect.arrayContaining(['blog', 'team/*/members']));
    expect(options!.entries).not.toContain('subscribers');
    expect(options!.include!('speakers/ada')).toBe(true);
    expect(options!.include!('subscribers/ada')).toBe(false);
  });

  it("says when it's in its stages", async () => {
    const result = await runStageSeed('returning-live', { dryRun: true });

    expect(output()).toContain(
      "The returning-live fixture is in these stages at 2017-10-13 11:00. Pick that time on the dev bar's clock: live.",
    );
    expect(output()).not.toContain('site.json');
    expect(result).toMatchObject({ ok: true, stage: 'returning-live', stages: ['live'] });
  });

  it('empties the content of a fixture that has none, and shows its site.json changes', async () => {
    await runStageSeed('first-call');

    const [documents, , options] = vi.mocked(importDocuments).mock.calls[0]!;
    expect(documents).toEqual([]);
    expect(options).toMatchObject({ replace: true });
    expect(output()).toContain('It also changes site.json, which you change by hand to see it:');
    expect(output()).toContain('"closes": "2017-03-31"');
  });

  it('names the fixtures for an unknown one', async () => {
    await expect(runStageSeed('nope')).rejects.toThrow(UsageError);
    await expect(runStageSeed('nope')).rejects.toThrow(/first-announced, first-call/);
    expect(importDocuments).not.toHaveBeenCalled();
  });

  it('seeds only the emulator', async () => {
    setTarget('production');

    await expect(runStageSeed('first-call')).rejects.toThrow(/only seeds the emulator/);
    expect(importDocuments).not.toHaveBeenCalled();
  });
});
