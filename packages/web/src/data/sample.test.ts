import { describe, expect, it } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { sampleDocuments, sampleFirestore } from './sample';

const ids = async (query: { get: () => Promise<{ docs: { id: string }[] }> }) =>
  (await query.get()).docs.map(({ id }) => id);

describe('sampleFirestore', () => {
  const db = sampleFirestore([
    { path: 'talks/b', data: { order: 2, title: 'é' } },
    { path: 'talks/a', data: { order: 2, title: 'z' } },
    { path: 'talks/c', data: { order: 1 } },
    { path: 'talks/d', data: { order: null } },
    { path: 'talks/a/notes/x', data: { order: 1 } },
    { path: 'rooms/r/notes/y', data: { order: 0 } },
  ]);

  it('lists a collection by document ID, without its subcollections', async () => {
    expect(await ids(db.collection('talks'))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('orders by a field with nulls first and ties by path, as Firestore does', async () => {
    expect(await ids(db.collection('talks').orderBy('order'))).toEqual(['d', 'c', 'a', 'b']);
    expect(await ids(db.collection('talks').orderBy('order', 'desc'))).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });

  it('leaves out documents without the field, and orders strings by UTF-8 bytes', async () => {
    expect(await ids(db.collection('talks').orderBy('title'))).toEqual(['a', 'b']);
  });

  it('finds a collection group under every parent, with the parent ID', async () => {
    const { docs } = await db.collectionGroup('notes').orderBy('order').get();

    expect(docs.map(({ id, ref }) => [id, ref.parent.parent?.id])).toEqual([
      ['y', 'r'],
      ['x', 'a'],
    ]);
  });
});

describe('sampleDocuments', () => {
  it('leaves out the collections of features that are off, as hb data seed does', () => {
    setFeatures({ blog: false });

    const paths = sampleDocuments().map(({ path }) => path);

    expect(paths.some((path) => path.startsWith('blog/'))).toBe(false);
    expect(paths.some((path) => path.startsWith('speakers/'))).toBe(true);
  });
});
