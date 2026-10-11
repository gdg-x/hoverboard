import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type Manifest,
  addToBackup,
  decode,
  encode,
  entryFor,
  fileFor,
  inPath,
  kindOf,
  readExport,
  writeExport,
} from './data-format.js';

const firestore = new Firestore({ projectId: 'demo-project' });
const meta: Omit<Manifest, 'format' | 'collections'> = {
  hoverboard: '4.0.0',
  schemaVersion: 1,
  projectId: 'demo-hoverboard',
  createdAt: '2027-10-15T09:00:00.000Z',
  command: 'hb data export',
};

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});
const tempFolder = () => {
  const folder = mkdtempSync(join(tmpdir(), 'hoverboard-export-'));
  folders.push(folder);
  return folder;
};

describe('entryFor and fileFor', () => {
  it.each([
    ['speakers/ada', 'speakers', 'collections/speakers.json'],
    ['sessions/101/feedback/uid', 'sessions/*/feedback', 'collections/sessions--feedback.json'],
    ['partners/gold/items/001', 'partners/*/items', 'collections/partners--items.json'],
    ['config/notifications', 'config/notifications', 'collections/config--notifications.json'],
    ['config/site', 'config/site', 'collections/config--site.json'],
    ['generatedSessions/101', 'generatedSessions', 'collections/generatedSessions.json'],
  ])('files %s under %s, in %s', (path, entry, file) => {
    expect(entryFor(path)).toBe(entry);
    expect(fileFor(entry)).toBe(file);
  });
});

describe('kindOf', () => {
  it.each([
    ['speakers/ada', 'content'],
    ['sessions/101/feedback/uid', 'visitor'],
    ['config/notifications', 'function'],
    ['config/migrations', 'cli'],
    ['config/site', 'retired'],
    ['schedule/2027-10-15', 'retired'],
    ['things/a', 'unknown'],
  ])('%s is %s', (path, kind) => {
    expect(kindOf(path)).toBe(kind);
  });
});

describe('inPath', () => {
  it('matches the documents of a collection, but not of its subcollections', () => {
    expect(inPath('speakers/ada', 'speakers')).toBe(true);
    expect(inPath('sessions/101/feedback/uid', 'sessions')).toBe(false);
    expect(inPath('sessions/101/feedback/uid', 'sessions/*/feedback')).toBe(true);
    expect(inPath('partners/gold/items/001', 'partners/gold/items')).toBe(true);
    expect(inPath('partners/silver/items/001', 'partners/gold/items')).toBe(false);
  });

  it('matches a document path', () => {
    expect(inPath('config/notifications', 'config/notifications')).toBe(true);
    expect(inPath('config/migrations', 'config/notifications')).toBe(false);
  });
});

describe('encode and decode', () => {
  it('keep timestamps to the nanosecond, references, geopoints and bytes', () => {
    const raw = {
      at: new Timestamp(1_822_381_200, 123_456_789),
      speaker: firestore.doc('speakers/ada'),
      place: new GeoPoint(49.8, 23.9),
      file: Buffer.from('hi'),
      list: [{ at: new Timestamp(0, 0) }, 'text', 1, null, true],
    };
    const json = encode(raw);

    expect(json).toEqual({
      at: { $timestamp: '2027-10-01T09:00:00.123456789Z' },
      speaker: { $reference: 'speakers/ada' },
      place: { $geopoint: [49.8, 23.9] },
      file: { $bytes: 'aGk=' },
      list: [{ at: { $timestamp: '1970-01-01T00:00:00Z' } }, 'text', 1, null, true],
    });
    expect(decode(firestore, JSON.parse(JSON.stringify(json)))).toEqual(raw);
  });

  it('reads timestamps written in milliseconds', () => {
    expect(decode(firestore, { $timestamp: '2027-10-15T09:00:00.120Z' })).toEqual(
      new Timestamp(Date.parse('2027-10-15T09:00:00Z') / 1000, 120_000_000),
    );
  });

  it('leaves objects that only look like tags', () => {
    const value = { $timestamp: '2027-10-15T09:00:00Z', other: 1 };
    expect(decode(firestore, value)).toEqual(value);
  });
});

describe('writeExport and readExport', () => {
  const documents = [
    { path: 'speakers/grace', data: { name: 'Grace' } },
    { path: 'speakers/ada', data: { name: 'Ada' } },
    { path: 'subscribers/x', data: { email: 'ada@example.com' } },
    { path: 'config/notifications', data: { icon: '/icon.png' } },
  ];

  it('writes one file per registry path, sorted, with a manifest', () => {
    const folder = tempFolder();

    const manifest = writeExport(folder, documents, meta);

    expect(manifest).toEqual({
      format: 1,
      ...meta,
      collections: {
        'config/notifications': {
          file: 'collections/config--notifications.json',
          documents: 1,
          kind: 'function',
          personal: false,
        },
        speakers: {
          file: 'collections/speakers.json',
          documents: 2,
          kind: 'content',
          personal: false,
        },
        subscribers: {
          file: 'collections/subscribers.json',
          documents: 1,
          kind: 'visitor',
          personal: true,
        },
      },
    });
    expect(readFileSync(join(folder, 'collections/speakers.json'), 'utf8')).toBe(
      '{\n  "speakers/ada": {\n    "name": "Ada"\n  },\n  "speakers/grace": {\n    "name": "Grace"\n  }\n}\n',
    );
    expect(readExport(folder)).toEqual({
      manifest,
      documents: [documents[3], documents[1], documents[0], documents[2]],
    });
  });

  it('replaces an export, without the files of collections it no longer has', () => {
    const folder = tempFolder();
    writeExport(folder, documents, meta);

    writeExport(folder, [documents[0]!], meta);

    expect(existsSync(join(folder, 'collections/subscribers.json'))).toBe(false);
    expect(readExport(folder).documents).toEqual([documents[0]]);
  });

  it('refuses a folder with other files', () => {
    const folder = tempFolder();
    writeFileSync(join(folder, 'notes.txt'), 'mine');

    expect(() => writeExport(folder, documents, meta)).toThrow("isn't empty");
  });

  it("refuses a folder that isn't an export, or is from a newer version", () => {
    const folder = tempFolder();
    expect(() => readExport(folder)).toThrow("isn't a Hoverboard export");

    mkdirSync(join(folder, 'collections'));
    writeFileSync(join(folder, 'manifest.json'), JSON.stringify({ format: 2, collections: {} }));
    expect(() => readExport(folder)).toThrow('newer format (2)');
  });
});

describe('addToBackup', () => {
  it('keeps the first copy of each document, and every created path', () => {
    const folder = join(tempFolder(), 'backup');

    addToBackup(folder, [{ path: 'speakers/ada', data: { name: 'Ada' } }], ['speakers/new'], meta);
    addToBackup(
      folder,
      [
        { path: 'speakers/ada', data: { name: 'Ada Lovelace' } },
        { path: 'speakers/grace', data: { name: 'Grace' } },
      ],
      ['speakers/new', 'speakers/newer'],
      meta,
    );

    const { manifest, documents } = readExport(folder);
    expect(documents).toEqual([
      { path: 'speakers/ada', data: { name: 'Ada' } },
      { path: 'speakers/grace', data: { name: 'Grace' } },
    ]);
    expect(manifest.created).toEqual(['speakers/new', 'speakers/newer']);
  });
});
