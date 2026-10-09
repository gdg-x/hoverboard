import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { toJson } from '../../../storage/validate.js';
import {
  type FirestoreDocument,
  checkDocuments,
  formatReport,
  listAllDocuments,
} from './firestore-check.js';

const tracks = [{ id: 'main', title: 'Main hall' }];
const on = { features: {}, complete: true, tracks };
const session = { title: 'Keynote', description: 'Opening talk' };
const speaker = {
  bio: '',
  company: '',
  companyLogo: '',
  companyLogoUrl: '',
  country: '',
  featured: false,
  name: 'Ada',
  photo: '',
  photoUrl: '',
  shortBio: '',
  socials: [],
  title: '',
};
const at = (startTime: string, endTime: string) => ({
  ...session,
  day: '2027-10-15',
  startTime,
  endTime,
  track: 'main',
});
const emulatorUrl = (path: string) => `http://127.0.0.1:4000/firestore/default/data/${path}`;

describe('toJson', () => {
  it('writes timestamps and references as the schema expects', () => {
    const firestore = new Firestore({ projectId: 'demo-project' });
    expect(
      toJson({
        at: Timestamp.fromDate(new Date('2027-10-15T09:00:00Z')),
        speakers: [firestore.doc('speakers/ada'), 'grace'],
        nested: { ok: true },
      }),
    ).toEqual({
      at: { $timestamp: '2027-10-15T09:00:00.000Z' },
      speakers: [{ $reference: 'speakers/ada' }, 'grace'],
      nested: { ok: true },
    });
  });
});

describe('checkDocuments', () => {
  it('passes valid documents of every kind', () => {
    const report = checkDocuments(
      [
        { path: 'sessions/101', data: { ...session, speakers: ['ada'] } },
        { path: 'speakers/ada', data: speaker },
        { path: 'team/core', data: { title: 'Organizers' } },
        { path: 'subscribers/a', data: { email: 'ada@example.com', firstName: '', lastName: '' } },
        { path: 'config/notifications', data: { icon: '/icon.png' } },
        {
          path: 'notificationsSubscribers/token',
          data: { value: true, updatedAt: { $timestamp: '2027-10-15T09:00:00.000Z' } },
        },
      ],
      on,
    );

    expect(report).toEqual({ checked: 6, problems: [], retired: new Map(), unknown: new Map() });
  });

  it('reports each problem with a link to the document', () => {
    const { problems } = checkDocuments(
      [
        { path: 'sessions/107', data: { ...session, extend: 2 } },
        { path: 'team/core/members/ada', data: { name: 'Ada' } },
      ],
      { ...on, projectId: 'demo-project' },
    );

    expect(problems).toContainEqual({
      message: 'sessions/107: unknown field "extend". Hoverboard doesn\'t read it.',
      warning: false,
      url: 'https://console.firebase.google.com/project/demo-project/firestore/databases/-default-/data/~2Fsessions~2F107',
    });
    expect(problems).toContainEqual(
      expect.objectContaining({ message: 'team/core/members/ada: missing "order".' }),
    );
  });

  it('groups problems in visitor data by collection, without IDs, keys or values', () => {
    const { problems } = checkDocuments(
      [
        {
          path: 'subscribers/ada',
          data: { email: 'ada.example.com', firstName: '', lastName: '' },
        },
        { path: 'subscribers/bob', data: { email: 'bob', firstName: '', lastName: '' } },
        { path: 'notificationsUsers/uid-1', data: { tokens: { 'secret-token': false } } },
        { path: 'featuredSessions/uid-2', data: { '101': null } },
      ],
      on,
    );

    expect(problems).toEqual([
      {
        message: 'featuredSessions: An entry must be a boolean, not null. In 1 document.',
        warning: false,
        url: emulatorUrl('featuredSessions'),
      },
      {
        message: 'notificationsUsers: tokens.* must be true. In 1 document.',
        warning: false,
        url: emulatorUrl('notificationsUsers'),
      },
      {
        message: 'subscribers: email must be an email address. In 2 documents.',
        warning: false,
        url: emulatorUrl('subscribers'),
      },
    ]);
    expect(JSON.stringify(problems)).not.toMatch(/ada|bob|uid-|secret/);
  });

  it('warns instead of failing for the content of features that are off', () => {
    const { problems } = checkDocuments(
      [
        { path: 'blog/hello', data: { title: 'Hello' } },
        { path: 'sentNotifications/1', data: {} },
      ],
      { ...on, features: { blog: false, functions: false } },
    );

    expect(problems).toContainEqual(
      expect.objectContaining({
        message: expect.stringMatching(
          /^blog\/hello: missing "\w+"\. Not an error, because features\.blog is off\.$/,
        ),
        warning: true,
      }),
    );
    expect(problems).toContainEqual({
      message:
        'sentNotifications/1: missing "createdAt". Not an error, because features.functions is off.',
      warning: true,
      url: emulatorUrl('sentNotifications/1'),
    });
  });

  it('checks the schedule and the speakers of sessions', () => {
    const { problems } = checkDocuments(
      [
        { path: 'sessions/a', data: { ...at('11:00', '11:40'), speakers: ['ada'] } },
        { path: 'sessions/b', data: at('11:20', '12:00') },
      ],
      on,
    );

    expect(problems).toEqual([
      { message: 'sessions/a and sessions/b overlap on 2027-10-15 in main', warning: false },
      {
        message: 'sessions/a: speaker "ada" doesn\'t exist.',
        warning: false,
        url: emulatorUrl('sessions/a'),
      },
    ]);
  });

  it('only checks speakers with every document', () => {
    const { problems } = checkDocuments(
      [{ path: 'sessions/a', data: { ...session, speakers: ['ada'] } }],
      { ...on, complete: false },
    );

    expect(problems).toEqual([]);
  });

  it('warns about missing documents with subcollections', () => {
    const { problems } = checkDocuments(
      [
        { path: 'partners/gold', data: undefined },
        {
          path: 'partners/gold/items/0',
          data: { name: 'GDG', logoUrl: '/a.svg', order: 0, url: '/' },
        },
      ],
      on,
    );

    expect(problems).toEqual([
      {
        message: "partners/gold doesn't exist, but has documents in subcollections.",
        warning: true,
        url: emulatorUrl('partners/gold'),
      },
    ]);
  });

  it('counts retired and unknown collections', () => {
    const report = checkDocuments(
      [
        { path: 'generatedSessions/1', data: {} },
        { path: 'generatedSessions/2', data: {} },
        { path: 'config/site', data: { domain: '' } },
        { path: 'config/other', data: {} },
        { path: 'speakers/ada/notes/1', data: {} },
        { path: 'misc/1', data: {} },
      ],
      on,
    );

    expect(report.checked).toBe(0);
    expect(report.retired).toEqual(
      new Map([
        ['generatedSessions', 2],
        ['config/site', 1],
      ]),
    );
    expect(report.unknown).toEqual(
      new Map([
        ['config/other', 1],
        ['speakers/*/notes', 1],
        ['misc', 1],
      ]),
    );
  });
});

describe('formatReport', () => {
  const report = {
    checked: 3,
    problems: [
      { message: 'sessions/107: unknown field "extend".', warning: false, url: 'https://x' },
      { message: 'blog/a: missing "title". Not an error.', warning: true },
    ],
    retired: new Map([
      ['users', 2],
      ['config/site', 1],
    ]),
    unknown: new Map([['misc', 1]]),
  };

  it('prints errors, warnings, retired and unknown collections, and a summary', () => {
    expect(formatReport(report, { projectId: 'demo-project' })).toEqual([
      '✘ sessions/107: unknown field "extend". https://x',
      '! blog/a: missing "title". Not an error.',
      '! users: 2 documents from before 4.0.0, which Hoverboard no longer uses. Delete them once you no longer need them, with npx firebase firestore:delete --recursive users --project demo-project',
      '! config/site: 1 document from before 4.0.0, which Hoverboard no longer uses. Delete it once you no longer need it, with npx firebase firestore:delete config/site --project demo-project',
      "! misc: 1 document that Hoverboard doesn't use.",
      '\n✘ Found 1 problem in 3 documents.',
    ]);
  });

  it('points to the Emulator UI without a project', () => {
    expect(formatReport(report)[2]).toContain(`with the Emulator UI, ${emulatorUrl('users')}`);
  });

  it('prints annotations in GitHub Actions', () => {
    expect(formatReport(report, { annotations: true }).slice(0, 2)).toEqual([
      '::error title=Firestore::sessions/107: unknown field "extend". https://x',
      '::warning title=Firestore::blog/a: missing "title". Not an error.',
    ]);
  });

  it('says when there is nothing to fix', () => {
    expect(
      formatReport({ checked: 1, problems: [], retired: new Map(), unknown: new Map() }),
    ).toEqual(['\n✔ 1 document checked, with no problems.']);
  });
});

describe('listAllDocuments', () => {
  interface Doc {
    data?: Record<string, unknown>;
    collections?: Collections;
  }
  type Collections = Record<string, Record<string, Doc>>;

  /** A fake Firestore with the listing calls the walk uses. */
  const fakeFirestore = (root: Collections) => {
    const collection = (path: string, docs: Record<string, Doc>) => ({
      listDocuments: async () =>
        Object.entries(docs).map(([id, doc]) => ({ path: `${path}/${id}`, doc })),
    });
    const collections = (parent: string, tree: Collections) =>
      Object.entries(tree).map(([name, docs]) =>
        collection(parent ? `${parent}/${name}` : name, docs),
      );
    return {
      listCollections: async () => collections('', root),
      collection: (path: string) => collection(path, root[path] ?? {}),
      getAll: async (...refs: { path: string; doc: Doc }[]) =>
        refs.map(({ path, doc }) => ({
          exists: doc.data !== undefined,
          data: () => doc.data,
          ref: { path, listCollections: async () => collections(path, doc.collections ?? {}) },
        })),
    } as unknown as Firestore;
  };

  const database = fakeFirestore({
    speakers: { ada: { data: { name: 'Ada', at: Timestamp.fromMillis(0) } } },
    partners: { gold: { collections: { items: { '0': { data: { name: 'GDG' } } } } } },
  });

  it('lists every document, with subcollections and missing parents', async () => {
    expect(await listAllDocuments(database)).toEqual<FirestoreDocument[]>([
      {
        path: 'speakers/ada',
        data: { name: 'Ada', at: { $timestamp: '1970-01-01T00:00:00.000Z' } },
      },
      { path: 'partners/gold', data: undefined },
      { path: 'partners/gold/items/0', data: { name: 'GDG' } },
    ]);
  });

  it('lists one collection', async () => {
    expect((await listAllDocuments(database, 'partners')).map(({ path }) => path)).toEqual([
      'partners/gold',
      'partners/gold/items/0',
    ]);
  });
});
