import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { siteTracks } from '../lib/content.js';
import { readExport, writeExport } from '../lib/data-format.js';
import { confirmChange } from '../lib/prompt.js';
import { setTarget } from '../lib/target.js';
import type { FirestoreDocument } from '../migrations/index.js';
import { listAllDocuments } from './data-check.js';
import { importProblems, migrate, planImport, runDataImport } from './data-import.js';

const { writer, firestore } = vi.hoisted(() => {
  const writer = {
    set: vi.fn(async (_ref: { path: string }, _data: unknown) => ({})),
    delete: vi.fn(async (_ref: { path: string }) => ({})),
    close: vi.fn(),
  };
  const firestore = { doc: (path: string) => ({ path }), bulkWriter: () => writer };
  return { writer, firestore };
});

vi.mock('../lib/firestore.js', () => ({ firestore }));
vi.mock('./data-check.js', () => ({ listAllDocuments: vi.fn() }));
vi.mock('../lib/prompt.js', () => ({ confirmChange: vi.fn() }));
vi.mock('../utils/firebase-project.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/firebase-project.js')>()),
  resolveFirebaseProjectId: () => 'fest-2027',
}));

const SAMPLE_DATA = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'sample-data');
const meta = {
  hoverboard: '4.0.0',
  projectId: 'demo-hoverboard',
  createdAt: '2027-10-15T09:00:00.000Z',
  command: 'hb data export',
};
const doc = (path: string, raw: Record<string, unknown>): FirestoreDocument => ({
  path,
  data: raw,
  raw,
});
const team = (title: string) => ({ title });
const written = () => writer.set.mock.calls.map(([ref]) => ref.path);
const deleted = () => writer.delete.mock.calls.map(([ref]) => ref.path);
const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');

const dirs: string[] = [];
let repo: string;

/** An export in a temporary folder. */
const exportOf = (documents: { path: string; data: Record<string, unknown> }[]) => {
  const folder = join(repo, 'export');
  writeExport(folder, documents, meta);
  return folder;
};

/** The documents in Firestore before the import. */
const existing = (documents: FirestoreDocument[]) =>
  vi
    .mocked(listAllDocuments)
    .mockImplementation(async (_firestore, root) =>
      documents.filter(({ path }) => path.startsWith(`${root}/`)),
    );

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-import-'));
  dirs.push(repo);
  mkdirSync(join(repo, '.git'));
  mkdirSync(join(repo, 'packages/config'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{ "version": "4.0.0" }');
  writeFileSync(join(repo, 'packages/config/site.json'), '{ "schemaVersion": 1, "schedule": {} }');
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  existing([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setTarget('emulator');
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const backups = () => {
  const folder = join(repo, '.firebase/backups');
  return existsSync(folder) ? readdirSync(folder).map((name) => join(folder, name)) : [];
};

describe('runDataImport', () => {
  it('writes new and changed documents, and backs up what it replaces', async () => {
    existing([
      doc('team/grace', team('Grace')),
      doc('team/linus', team('Linus')),
      doc('team/old', team('Old')),
    ]);
    const folder = exportOf([
      { path: 'team/ada', data: team('Ada') },
      { path: 'team/grace', data: team('Grace Hopper') },
      { path: 'team/linus', data: team('Linus') },
    ]);

    const result = await runDataImport(folder);

    expect(written()).toEqual(['team/ada', 'team/grace']);
    expect(deleted()).toEqual([]);
    expect(writer.close).toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      written: 2,
      deleted: 0,
      collections: { team: { added: 1, changed: 1, unchanged: 1, deleted: 0 } },
    });
    expect(output()).toContain('team: 1 new, 1 changed, 1 unchanged');
    const [backup] = backups();
    const { manifest, documents } = readExport(backup!);
    expect(documents).toEqual([{ path: 'team/grace', data: team('Grace') }]);
    expect(manifest.created).toEqual(['team/ada']);
    expect(output()).toContain(`Undo with: ./hb data check --restore .firebase/backups/`);
  });

  it('also deletes what the export lacks in its collections with replace', async () => {
    existing([
      doc('team/old', team('Old')),
      doc('sessions/101', { title: 'Talk', description: '' }),
    ]);
    const folder = exportOf([{ path: 'team/ada', data: team('Ada') }]);

    await runDataImport(folder, { replace: true });

    expect(written()).toEqual(['team/ada']);
    expect(deleted()).toEqual(['team/old']);
    expect(readExport(backups()[0]!).documents.map(({ path }) => path)).toEqual(['team/old']);
  });

  it('writes nothing, and makes no backup, in a dry run', async () => {
    existing([doc('team/ada', team('Old'))]);
    const folder = exportOf([{ path: 'team/ada', data: team('Ada') }]);

    const result = await runDataImport(folder, { dryRun: true });

    expect(result).toMatchObject({ ok: true, written: 1, dryRun: true });
    expect(writer.set).not.toHaveBeenCalled();
    expect(backups()).toEqual([]);
    expect(output()).toContain('Dry run: would write 1 document. Nothing was written.');
  });

  it('writes nothing when a document is invalid, and names every problem', async () => {
    const folder = exportOf([
      { path: 'team/ada', data: { title: 'Ada', unknown: true } },
      { path: 'team/grace', data: team('Grace') },
      { path: 'tickets/001', data: { name: 'Regular' } },
    ]);

    expect(await runDataImport(folder)).toBe(false);

    expect(writer.set).not.toHaveBeenCalled();
    expect(output()).toContain('team/ada: unknown field "unknown"');
    expect(output()).toContain('tickets/001: missing');
  });

  it('imports only the requested collections', async () => {
    const folder = exportOf([
      { path: 'team/ada', data: team('Ada') },
      { path: 'blog/hello', data: { title: 'Hello' } },
    ]);

    await runDataImport(folder, { collection: ['team'] });

    expect(written()).toEqual(['team/ada']);
  });

  it('asks before writing to production, and writes nothing when told no', async () => {
    setTarget('production');
    vi.mocked(confirmChange).mockResolvedValue(false);
    const folder = exportOf([{ path: 'team/ada', data: team('Ada') }]);

    expect(await runDataImport(folder)).toBe(false);

    expect(confirmChange).toHaveBeenCalledWith(
      '\nWrite 1 document in fest-2027? What it replaces is backed up first.',
      false,
    );
    expect(writer.set).not.toHaveBeenCalled();
  });

  it('runs the migrations an old export needs, and changes site.json', async () => {
    const folder = exportOf([
      {
        path: 'schedule/2027-10-15',
        data: {
          date: '2027-10-15',
          tracks: [{ title: 'Main' }],
          timeslots: [{ startTime: '09:00', endTime: '09:40', sessions: [{ items: ['101'] }] }],
        },
      },
      { path: 'sessions/101', data: { title: 'Keynote', description: '' } },
    ]);

    await runDataImport(folder);

    expect(writer.set).toHaveBeenCalledWith(
      { path: 'sessions/101' },
      {
        title: 'Keynote',
        description: '',
        day: '2027-10-15',
        startTime: '09:00',
        endTime: '09:40',
      },
    );
    expect(output()).toContain('Migration 4.0.0-schedule-on-sessions');
    expect(JSON.parse(readFileSync(join(repo, 'packages/config/site.json'), 'utf8'))).toEqual({
      schemaVersion: 1,
      schedule: { tracks: [{ id: 'main', title: 'Main' }] },
    });
  });
});

describe('planImport', () => {
  it('only deletes documents of the imported collections that are included', () => {
    const plan = planImport(
      [doc('team/ada', team('Ada'))],
      [doc('team/old', team('Old')), doc('team/kept', team('Kept'))],
      { replace: true, include: (path) => path !== 'team/kept' },
    );

    expect(plan.deletes.map(({ path }) => path)).toEqual(['team/old']);
  });
});

describe('the sample data', () => {
  it('imports with no pending migration and no problems', () => {
    const documents = readExport(SAMPLE_DATA).documents.map(({ path, data }) => ({
      path,
      data,
      raw: data,
    }));

    expect(migrate(documents, {}).applied).toEqual([]);
    expect(importProblems(documents, siteTracks())).toEqual([]);
  });
});
