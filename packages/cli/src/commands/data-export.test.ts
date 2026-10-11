import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readExport } from '../lib/data-format.js';
import { setTarget } from '../lib/target.js';
import type { FirestoreDocument } from '../migrations/index.js';
import { listAllDocuments } from './data-check.js';
import { exportDocuments, runDataExport } from './data-export.js';

vi.mock('./data-check.js', () => ({ listAllDocuments: vi.fn() }));
vi.mock('../lib/firestore.js', () => ({ firestore: {} }));
vi.mock('../utils/firebase-project.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/firebase-project.js')>()),
  resolveFirebaseProjectId: () => 'fest-2027',
}));

const firestore = new Firestore({ projectId: 'demo-project' });
const doc = (path: string, raw?: Record<string, unknown>): FirestoreDocument => ({
  path,
  data: raw,
  raw,
});
const documents = [
  doc('speakers/ada', { name: 'Ada', joined: new Timestamp(1, 5) }),
  doc('sessions/101/feedback/uid', { contentRating: 5 }),
  doc('sessions/102'),
  doc('config/notifications', { icon: '/icon.png' }),
  doc('schedule/2027-10-15', { date: '2027-10-15' }),
  doc('things/a', { a: 1 }),
];

beforeEach(() => {
  vi.mocked(listAllDocuments).mockImplementation(async (_firestore, root) =>
    root ? documents.filter(({ path }) => path.startsWith(`${root}/`)) : documents,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setTarget('emulator');
});

const paths = (exported: { path: string }[]) => exported.map(({ path }) => path);

describe('exportDocuments', () => {
  it("exports the registry's collections, with every type kept", async () => {
    const exported = await exportDocuments(firestore);

    expect(paths(exported)).toEqual([
      'speakers/ada',
      'sessions/101/feedback/uid',
      'config/notifications',
    ]);
    expect(exported[0]!.data).toEqual({
      name: 'Ada',
      joined: { $timestamp: '1970-01-01T00:00:01.000000005Z' },
    });
  });

  it("also exports collections Hoverboard doesn't use with all", async () => {
    expect(paths(await exportDocuments(firestore, { all: true }))).toContain('schedule/2027-10-15');
  });

  it('leaves out visitor and function data with content', async () => {
    expect(paths(await exportDocuments(firestore, { content: true }))).toEqual(['speakers/ada']);
  });

  it('lists and exports only the requested collections', async () => {
    const exported = await exportDocuments(firestore, {
      collection: ['sessions/*/feedback', 'schedule'],
    });

    expect(paths(exported)).toEqual(['sessions/101/feedback/uid', 'schedule/2027-10-15']);
    expect(vi.mocked(listAllDocuments).mock.calls.map(([, root]) => root)).toEqual([
      'sessions',
      'schedule',
    ]);
  });
});

describe('runDataExport', () => {
  const dirs: string[] = [];
  afterEach(() => {
    vi.unstubAllEnvs();
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('writes the folder with a manifest, and says when it holds personal data', async () => {
    const repo = mkdtempSync(join(tmpdir(), 'hoverboard-export-'));
    dirs.push(repo);
    mkdirSync(join(repo, '.git'));
    mkdirSync(join(repo, 'packages/config'), { recursive: true });
    writeFileSync(join(repo, 'package.json'), '{ "version": "4.0.0" }');
    writeFileSync(join(repo, 'packages/config/site.json'), '{ "schemaVersion": 1 }');
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    vi.stubEnv('INIT_CWD', repo);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    setTarget('production');

    const result = await runDataExport('out', { command: 'hb data export out --production' });

    const { manifest } = readExport(join(repo, 'out'));
    expect(manifest).toMatchObject({
      hoverboard: '4.0.0',
      schemaVersion: 1,
      projectId: 'fest-2027',
      command: 'hb data export out --production',
    });
    expect(result).toEqual({
      ok: true,
      folder: join(repo, 'out'),
      collections: { 'config/notifications': 1, 'sessions/*/feedback': 1, speakers: 1 },
    });
    expect(log).toHaveBeenCalledWith('  sessions/*/feedback: 1 document (personal data)');
    expect(log).toHaveBeenCalledWith(
      '! It holds personal data, such as emails or push tokens. Keep it private.',
    );
    expect(readFileSync(join(repo, 'out/collections/speakers.json'), 'utf8')).toContain(
      '"speakers/ada"',
    );
  });
});
