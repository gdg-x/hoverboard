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
  const query = (kind: string, path: string) => ({
    orderBy: (field: string, direction = 'asc') => ({
      get: () => {
        queries.push(`${kind} ${path} by ${field} ${direction}`);
        return Promise.resolve({
          docs: (docs[path] ?? []).map(({ id, data, parentId }) => ({
            id,
            data: () => data,
            ref: { parent: { parent: parentId ? { id: parentId } : null } },
          })),
        });
      },
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
      'collection generatedSchedule by date asc',
      'collection generatedSessions by id asc',
      'collection generatedSpeakers by name asc',
      'collection partners by order asc',
      'collection previousSpeakers by name asc',
      'collection team by title asc',
      'collection tickets by order asc',
      'collection videos by order asc',
      'group items by order asc',
      'group members by name asc',
    ]);
  });

  it('adds document IDs, and parent IDs for collection groups', async () => {
    const { db } = fakeFirestore({
      generatedSpeakers: [{ id: 'ada', data: { name: 'Ada' } }],
      members: [{ id: 'grace', parentId: 'core', data: { name: 'Grace' } }],
    });

    const content = await readContent(db);

    expect(content.speakers).toEqual([{ id: 'ada', name: 'Ada' }]);
    expect(content.members).toEqual([{ id: 'grace', parentId: 'core', name: 'Grace' }]);
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
    const { db } = fakeFirestore();

    expect(await readContent(db)).toHaveProperty('sessions');

    setFeatures({ schedule: false, speakers: false });

    expect(await readContent(db)).not.toHaveProperty('sessions');
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
