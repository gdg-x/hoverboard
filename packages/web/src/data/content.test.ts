import type { Firestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { connectFirestore } from './firestore';
import { loadContent, readContent } from './content';

vi.mock('./firestore');

interface Doc {
  id: string;
  data: Record<string, unknown>;
  parentId?: string;
}

/** A Firestore stand-in that records each query and returns `docs` for its path. */
const fakeFirestore = (docs: Record<string, Doc[]> = {}) => {
  const queries: string[] = [];
  // The collections that partner items and team members are under.
  const parents: Record<string, string> = { items: 'partners', members: 'team' };
  const get = (description: string, path: string) => () => {
    queries.push(description);
    return Promise.resolve({
      docs: (docs[path] ?? []).map(({ id, data, parentId }) => ({
        id,
        data: () => data,
        ref: {
          path: parentId ? `${parents[path]}/${parentId}/${path}/${id}` : `${path}/${id}`,
          parent: { parent: parentId ? { id: parentId } : null },
        },
      })),
    });
  };
  const query = (kind: string, path: string) => ({
    get: get(`${kind} ${path}`, path),
    orderBy: (field: string, direction = 'asc') => ({
      get: get(`${kind} ${path} by ${field} ${direction}`, path),
    }),
  });
  const db = {
    collection: (path: string) => query('collection', path),
    collectionGroup: (path: string) => query('group', path),
  } as unknown as Firestore;
  return { db, queries };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('readContent', () => {
  it('reads every collection the client subscribes to, in the same order', async () => {
    const { db, queries } = fakeFirestore();

    await readContent(db);

    expect(queries.sort()).toEqual([
      'collection blog by published desc',
      'collection gallery by order asc',
      'collection partners by order asc',
      'collection previousSpeakers by name asc',
      'collection sessions',
      'collection speakers',
      'collection team by title asc',
      'collection tickets by order asc',
      'collection videos by order asc',
      'group items by order asc',
      'group members by name asc',
    ]);
  });

  it('adds document IDs, and parent IDs for collection groups', async () => {
    const { db } = fakeFirestore({
      previousSpeakers: [{ id: 'ada', data: { name: 'Ada' } }],
      members: [{ id: 'grace', parentId: 'core', data: { name: 'Grace' } }],
    });

    const content = await readContent(db);

    expect(content.previousSpeakers).toEqual([{ id: 'ada', name: 'Ada' }]);
    expect(content.members).toEqual([{ id: 'grace', parentId: 'core', name: 'Grace' }]);
  });

  it('reads the raw sessions and speakers', async () => {
    const { db } = fakeFirestore({
      sessions: [{ id: 'talk', data: { title: 'Talk', speakers: ['ada'] } }],
      speakers: [{ id: 'ada', data: { name: 'Ada' } }],
    });

    const content = await readContent(db);

    expect(content.sessions).toEqual([{ id: 'talk', title: 'Talk', speakers: ['ada'] }]);
    expect(content.speakers).toEqual([{ id: 'ada', name: 'Ada' }]);
    expect(content).not.toHaveProperty('schedule');
  });

  it('warns when no session has a day, as before converting the old schedule', async () => {
    const { db } = fakeFirestore({ sessions: [{ id: 'talk', data: { title: 'Talk' } }] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await readContent(db);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('./hb convert-schedule'));
    warn.mockRestore();
  });

  it('fails a build on sessions the schedule cannot show, and only warns in development', async () => {
    const overlap = {
      title: 'Talk',
      description: '',
      day: '2016-09-09',
      track: 'expo-hall',
      endTime: '10:00',
    };
    const { db } = fakeFirestore({
      sessions: [
        { id: 'a', data: { ...overlap, startTime: '09:00' } },
        { id: 'b', data: { ...overlap, startTime: '09:30' } },
      ],
    });
    const message =
      'The content in Firestore has problems:\n' +
      '  sessions/a and sessions/b overlap on 2016-09-09 in expo-hall\n' +
      'Fix them in the Firebase console, then check with `./hb firestore-check`.';

    vi.stubEnv('DEV', false);
    await expect(readContent(db)).rejects.toThrow(message);

    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(readContent(db)).resolves.toHaveProperty('sessions');
    expect(warn).toHaveBeenCalledWith(message);
    warn.mockRestore();
  });

  it('fails a build on documents that the schema rejects, with links to them', async () => {
    const { db } = fakeFirestore({
      sessions: [{ id: 'talk', data: { title: 'Talk', extend: 2 } }],
      members: [{ id: 'ada', parentId: 'core', data: { name: 'Ada' } }],
    });

    vi.stubEnv('DEV', false);
    const error = await readContent(db).then(
      () => new Error('The build passed'),
      (caught: unknown) => caught as Error,
    );

    expect(error.message).toContain(
      `  sessions/talk: missing "description". http://127.0.0.1:4000/firestore/default/data/sessions/talk`,
    );
    expect(error.message).toContain('  sessions/talk: unknown field "extend".');
    expect(error.message).toContain('  team/core/members/ada: missing "order".');
  });

  it('links to the Firebase console when it reads production', async () => {
    const { db } = fakeFirestore({ sessions: [{ id: 'talk', data: { title: 'Talk' } }] });

    vi.stubEnv('DEV', false);
    vi.stubEnv('FIRESTORE_TARGET', 'production');

    await expect(readContent(db)).rejects.toThrow(
      /https:\/\/console\.firebase\.google\.com\/project\/[\w-]+\/firestore\/databases\/-default-\/data\/~2Fsessions~2Ftalk/,
    );
  });

  it('warns about invalid content of features that are off, without failing the build', async () => {
    setFeatures({ blog: false });
    const { db, queries } = fakeFirestore({ blog: [{ id: 'hello', data: { title: 'Hello' } }] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vi.stubEnv('DEV', false);
    const content = await readContent(db);

    expect(content).not.toHaveProperty('blog');
    expect(queries).toContain('collection blog');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /^blog\/hello: missing "\w+"\. .* Not a build error, because features\.blog is off\. Fix it before turning it on\.$/,
      ),
    );
    warn.mockRestore();
  });

  it('only reads the content of features that are off in production builds', async () => {
    setFeatures({ blog: false });
    const { db, queries } = fakeFirestore();

    vi.stubEnv('DEV', true);
    await readContent(db);

    expect(queries).not.toContain('collection blog');
  });

  it('leaves out the content of disabled features', async () => {
    setFeatures({ team: false, partners: false });
    const { db, queries } = fakeFirestore();

    const content = await readContent(db);

    for (const name of ['teams', 'members', 'partners', 'partnerGroups']) {
      expect(content).not.toHaveProperty(name);
    }
    expect(queries).not.toContain('collection team by title asc');
    expect(queries).not.toContain('group items by order asc');
    expect(content).toHaveProperty('speakers');
  });

  it('reads sessions for the speakers page while the schedule is off', async () => {
    setFeatures({ schedule: false });
    const { db, queries } = fakeFirestore();

    expect(await readContent(db)).toHaveProperty('sessions');

    setFeatures({ schedule: false, speakers: false });
    queries.length = 0;

    expect(await readContent(db)).not.toHaveProperty('sessions');
    expect(queries).not.toContain('collection sessions');
  });
});

describe('loadContent', () => {
  it('reads once for a build', async () => {
    vi.stubEnv('DEV', false);
    vi.mocked(connectFirestore).mockResolvedValue(fakeFirestore().db);

    const [first, second] = await Promise.all([loadContent(), loadContent()]);

    expect(first).toBe(second);
    expect(connectFirestore).toHaveBeenCalledTimes(1);
  });

  it('builds without Firestore and without content with FIRESTORE_TARGET=none', async () => {
    vi.stubEnv('FIRESTORE_TARGET', 'none');
    setFeatures({ team: false });
    vi.mocked(connectFirestore).mockClear();

    const content = await loadContent();

    expect(connectFirestore).not.toHaveBeenCalled();
    expect(content.speakers).toEqual([]);
    expect(content).not.toHaveProperty('teams');
  });
});
