import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FieldPath, FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it } from 'vitest';
import type { FirestoreDocument } from '../migrations/index.js';
import { SITE_CONFIG_PATH } from '../utils/firebase-project.js';
import {
  applyFixes,
  backupFolderFor,
  backupName,
  formatPlan,
  planFixes,
  restoreBackup,
  shownPath,
} from './firestore-fix.js';

const repos: string[] = [];
afterEach(() => {
  for (const repo of repos.splice(0)) rmSync(repo, { recursive: true, force: true });
});

const makeRepo = () => {
  const repo = mkdtempSync(join(tmpdir(), 'hoverboard-fix-'));
  repos.push(repo);
  mkdirSync(join(repo, 'packages/config'), { recursive: true });
  writeFileSync(join(repo, SITE_CONFIG_PATH), '{ "schedule": {} }\n');
  return repo;
};

/** A fake Firestore that records writes, and fails updates of `stale` paths' preconditions. */
const fakeFirestore = (stale: string[] = []) => {
  const writes: unknown[][] = [];
  const firestore = {
    doc: (path: string) => ({
      path,
      update: async (...args: unknown[]) => {
        if (stale.includes(path)) throw Object.assign(new Error('stale'), { code: 9 });
        writes.push(['update', path, ...args]);
      },
      create: async (data: unknown) => writes.push(['create', path, data]),
      set: async (...args: unknown[]) => writes.push(['set', path, ...args]),
      delete: async (...args: unknown[]) => writes.push(['delete', path, ...args]),
    }),
    batch: () => {
      const operations: unknown[][] = [];
      return {
        create: (ref: { path: string }, data: unknown) =>
          operations.push(['create', ref.path, data]),
        delete: (ref: { path: string }, precondition: unknown) =>
          operations.push(['delete', ref.path, precondition]),
        commit: async () => {
          if (operations.some(([, path]) => stale.includes(path as string))) {
            throw Object.assign(new Error('stale'), { code: 9 });
          }
          writes.push(['batch', ...operations]);
        },
      };
    },
  } as unknown as Firestore;
  return { firestore, writes };
};

const at = Timestamp.fromMillis(1);
const doc = (path: string, raw: Record<string, unknown>): FirestoreDocument => ({
  path,
  data: raw,
  raw,
  updateTime: at,
});
const ticketData = {
  available: true,
  currency: '$',
  info: '',
  name: 'Regular',
  price: '120',
  soldOut: false,
  url: '/',
};
const ticket = doc('tickets/regular', ticketData);
const session = doc('sessions/101', { title: 'Keynote', description: '', extend: 1 });

describe('planFixes', () => {
  it('lists the fixes of each document', () => {
    const plan = planFixes([ticket, doc('team/core', { title: 'Core' })], 'UTC');
    expect(plan.migrations).toEqual([]);
    expect(formatPlan(plan)).toEqual(['Fixes:', '  tickets/regular: price "120" to 120']);
  });

  it('shows nothing when there is nothing to fix', () => {
    expect(formatPlan(planFixes([doc('team/core', { title: 'Core' })], 'UTC'))).toEqual([]);
  });

  it('counts the fixes of visitor documents, without their IDs', () => {
    const tokens = [
      doc('notificationsSubscribers/secret-1', { value: true }),
      doc('notificationsSubscribers/secret-2', { value: true }),
      doc('featuredSessions/uid-1', { '101': null, '102': true, '103': null }),
    ];
    const lines = formatPlan(planFixes(tokens, 'UTC'));

    expect(lines).toEqual([
      'Fixes:',
      '  notificationsSubscribers: updatedAt set to the current time, in 2 documents',
      '  featuredSessions: null entries removed, in 1 document',
    ]);
    expect(shownPath('notificationsSubscribers/secret-1')).toBe(
      'notificationsSubscribers (a document)',
    );
  });
});

describe('applyFixes', () => {
  it('moves sign-ups off email IDs in one batch each, and backs them up', async () => {
    const repo = makeRepo();
    const { firestore, writes } = fakeFirestore(['subscribers/gracecompanycom']);
    const ada = { email: 'ada@example.com', firstName: '', lastName: '' };
    const grace = { email: 'grace@company.com', firstName: '', lastName: '' };
    const documents = [
      doc('subscribers/adaexamplecom', ada),
      doc('subscribers/gracecompanycom', grace),
    ];
    const backupFolder = join(repo, 'backup');
    const plan = planFixes(documents, 'UTC');
    const [toAda] = plan.migrations[0]!.plan.moves!.map(({ to }) => to);

    const result = await applyFixes({
      firestore,
      plan,
      documents,
      list: async () => documents,
      timeZone: 'UTC',
      repoRoot: repo,
      backupFolder,
    });

    expect(result.skipped).toEqual(['subscribers/gracecompanycom']);
    expect(writes).toEqual([
      [
        'batch',
        ['create', toAda, ada],
        ['delete', 'subscribers/adaexamplecom', { lastUpdateTime: at }],
      ],
    ]);
    const backup = JSON.parse(readFileSync(join(backupFolder, 'documents.json'), 'utf8'));
    expect(Object.keys(backup.documents)).toEqual([
      'subscribers/adaexamplecom',
      'subscribers/gracecompanycom',
    ]);
    expect(backup.created).toHaveLength(2);
  });

  it('sets a missing updatedAt to the server time', async () => {
    const repo = makeRepo();
    const { firestore, writes } = fakeFirestore();
    const documents = [doc('notificationsSubscribers/token', { value: true })];

    await applyFixes({
      firestore,
      plan: planFixes(documents, 'UTC'),
      documents,
      list: async () => documents,
      timeZone: 'UTC',
      repoRoot: repo,
      backupFolder: join(repo, 'backup'),
    });

    expect(writes).toEqual([
      [
        'update',
        'notificationsSubscribers/token',
        new FieldPath('updatedAt'),
        FieldValue.serverTimestamp(),
        { lastUpdateTime: at },
      ],
    ]);
  });

  it('deletes a sign-up without a valid email, after backing it up', async () => {
    const repo = makeRepo();
    const { firestore, writes } = fakeFirestore();
    const spam = { email: '<script>', firstName: '', lastName: '' };
    const documents = [doc('subscribers/spam', spam)];
    const backupFolder = join(repo, 'backup');

    await applyFixes({
      firestore,
      plan: planFixes(documents, 'UTC'),
      documents,
      list: async () => documents,
      timeZone: 'UTC',
      repoRoot: repo,
      backupFolder,
    });

    expect(writes).toEqual([['delete', 'subscribers/spam', { lastUpdateTime: at }]]);
    expect(JSON.parse(readFileSync(join(backupFolder, 'documents.json'), 'utf8'))).toEqual({
      documents: { 'subscribers/spam': spam },
      created: [],
    });
  });

  it('backs up each document, then updates it if it is unchanged since the check', async () => {
    const repo = makeRepo();
    const { firestore, writes } = fakeFirestore(['sessions/101']);
    const documents = [ticket, session];
    const { folder } = backupFolderFor(repo, new Date('2027-10-15T09:00:00Z'));

    const result = await applyFixes({
      firestore,
      plan: planFixes(documents, 'UTC'),
      documents,
      list: async () => documents,
      timeZone: 'UTC',
      repoRoot: repo,
      backupFolder: folder,
    });

    expect(result).toEqual({ written: 1, skipped: ['sessions/101'] });
    expect(writes).toEqual([
      ['update', 'tickets/regular', new FieldPath('price'), 120, { lastUpdateTime: at }],
    ]);
    expect(JSON.parse(readFileSync(join(folder, 'documents.json'), 'utf8'))).toEqual({
      documents: {
        'tickets/regular': ticketData,
        'sessions/101': { title: 'Keynote', description: '', extend: 1 },
      },
      created: [],
    });
  });

  it('runs a migration, records it, then fixes what the documents are after it', async () => {
    const repo = makeRepo();
    const { firestore, writes } = fakeFirestore();
    const schedule = doc('schedule/2027-10-15', {
      date: '2027-10-15',
      tracks: [{ title: 'Main' }],
      timeslots: [{ startTime: '09:00', endTime: '09:40', sessions: [{ items: ['101'] }] }],
    });
    const documents = [schedule, session];
    const migrated = doc('sessions/101', { title: 'Keynote', description: '', day: '2027-10-15' });
    const plan = planFixes(documents, 'UTC');
    expect(plan.migrations.map(({ migration }) => migration.id)).toEqual([
      '4.0.0-schedule-on-sessions',
    ]);

    await applyFixes({
      firestore,
      plan,
      documents,
      list: async () => [schedule, migrated, ticket],
      timeZone: 'UTC',
      repoRoot: repo,
      backupFolder: join(repo, 'backup'),
    });

    expect(writes.map(([kind, path]) => `${String(kind)} ${String(path)}`)).toEqual([
      'update sessions/101',
      'set config/migrations',
      'update tickets/regular',
    ]);
    expect(writes[0]).toContainEqual(FieldValue.delete());
    expect(writes[1]![2]).toEqual({
      '4.0.0-schedule-on-sessions': { ranAt: FieldValue.serverTimestamp(), documents: 1 },
    });
    expect(JSON.parse(readFileSync(join(repo, SITE_CONFIG_PATH), 'utf8'))).toEqual({
      schedule: { tracks: [{ id: 'main', title: 'Main' }] },
    });
  });
});

describe('restoreBackup', () => {
  it('writes back the documents as they were, and deletes the created ones', async () => {
    const repo = makeRepo();
    const folder = join(repo, 'backup');
    mkdirSync(folder);
    writeFileSync(
      join(folder, 'documents.json'),
      JSON.stringify({
        documents: { 'sessions/101': { at: { $timestamp: '1970-01-01T00:00:00.001Z' } } },
        created: ['sessions/101-2'],
      }),
    );
    const { firestore, writes } = fakeFirestore();

    expect(await restoreBackup(firestore, folder)).toBe(2);
    expect(writes).toEqual([
      ['set', 'sessions/101', { at: Timestamp.fromMillis(1) }],
      ['delete', 'sessions/101-2'],
    ]);
  });
});

describe('backupName', () => {
  it('has no colons', () => {
    expect(backupName(new Date('2027-10-15T09:00:00Z'))).toBe('2027-10-15T09-00-00.000Z');
  });
});
