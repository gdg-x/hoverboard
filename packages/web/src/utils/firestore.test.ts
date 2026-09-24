import { Success } from '@abraham/remotedata';
import {
  collection,
  collectionGroup,
  doc,
  DocumentData,
  DocumentSnapshot,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { db } from '../firebase';
import {
  dataWithParentId,
  mergeDataAndId,
  subscribeToCollection,
  subscribeToCollectionGroup,
  subscribeToDocument,
} from './firestore';

vi.mock('firebase/firestore');

describe('mergeDataAndId', () => {
  it('merges the snapshot data with its id', () => {
    const snapshot = {
      id: 'abc',
      data: () => ({ name: 'Ada' }),
    } as unknown as QueryDocumentSnapshot<DocumentData>;

    expect(mergeDataAndId(snapshot)).toStrictEqual({ name: 'Ada', id: 'abc' });
  });
});

describe('dataWithParentId', () => {
  it('merges the snapshot data with its id and parent id', () => {
    const snapshot = {
      id: 'abc',
      data: () => ({ name: 'Ada' }),
      ref: { parent: { parent: { id: 'parent-abc' } } },
    } as unknown as QueryDocumentSnapshot<DocumentData>;

    expect(dataWithParentId(snapshot)).toStrictEqual({
      name: 'Ada',
      id: 'abc',
      parentId: 'parent-abc',
    });
  });
});

describe('subscribeToDocument', () => {
  it('subscribes, calls onStart, and forwards existing document data', () => {
    const unsubscribe = vi.fn();
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();
    vi.mocked(doc).mockReturnValue('doc-ref' as unknown as ReturnType<typeof doc>);
    vi.mocked(onSnapshot).mockImplementation((_ref, nextOrObserver) => {
      const snapshot = {
        exists: () => true,
        id: 'abc',
        data: () => ({ name: 'Ada' }),
      } as unknown as DocumentSnapshot<DocumentData>;
      (nextOrObserver as (snapshot: DocumentSnapshot<DocumentData>) => void)(snapshot);
      return unsubscribe;
    });

    const subscription = subscribeToDocument('users/abc', onStart, onNext, onError);

    expect(onStart).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledWith({ name: 'Ada', id: 'abc' });
    expect(subscription).toStrictEqual(new Success(unsubscribe));
  });

  it('forwards undefined when the document does not exist', () => {
    const onNext = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_ref, nextOrObserver) => {
      const snapshot = { exists: () => false } as unknown as DocumentSnapshot<DocumentData>;
      (nextOrObserver as (snapshot: DocumentSnapshot<DocumentData>) => void)(snapshot);
      return vi.fn();
    });

    subscribeToDocument('users/abc', vi.fn(), onNext, vi.fn());

    expect(onNext).toHaveBeenCalledWith(undefined);
  });

  it('forwards errors', () => {
    const onError = vi.fn();
    const error = new Error('boom');
    vi.mocked(onSnapshot).mockImplementation((_ref, _nextOrObserver, errorCallback) => {
      (errorCallback as unknown as (error: Error) => void)(error);
      return vi.fn();
    });

    subscribeToDocument('users/abc', vi.fn(), vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('subscribeToCollection', () => {
  it('queries ordered by name by default and forwards mapped docs', () => {
    const onNext = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_query, nextOrObserver) => {
      const snapshot = {
        docs: [
          { id: 'a', data: () => ({ name: 'Ada' }) },
          { id: 'b', data: () => ({ name: 'Bo' }) },
        ],
      } as unknown as QuerySnapshot<DocumentData>;
      (nextOrObserver as (snapshot: QuerySnapshot<DocumentData>) => void)(snapshot);
      return vi.fn();
    });

    subscribeToCollection('speakers', vi.fn(), onNext, vi.fn());

    expect(collection).toHaveBeenCalledWith(db, 'speakers');
    expect(orderBy).toHaveBeenCalledWith('name');
    expect(onNext).toHaveBeenCalledWith([
      { name: 'Ada', id: 'a' },
      { name: 'Bo', id: 'b' },
    ]);
  });

  it('accepts a custom order', () => {
    const customOrder = orderBy('order');
    vi.mocked(onSnapshot).mockImplementation(() => vi.fn());

    subscribeToCollection('videos', vi.fn(), vi.fn(), vi.fn(), customOrder);

    expect(query).toHaveBeenCalledWith(undefined, customOrder);
  });
});

describe('subscribeToCollectionGroup', () => {
  it('queries the collection group and forwards docs with their parent id', () => {
    const onNext = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_query, nextOrObserver) => {
      const snapshot = {
        docs: [
          {
            id: 'a',
            data: () => ({ name: 'Ada' }),
            ref: { parent: { parent: { id: 'team-1' } } },
          },
        ],
      } as unknown as QuerySnapshot<DocumentData>;
      (nextOrObserver as (snapshot: QuerySnapshot<DocumentData>) => void)(snapshot);
      return vi.fn();
    });

    subscribeToCollectionGroup('members', vi.fn(), onNext, vi.fn());

    expect(collectionGroup).toHaveBeenCalledWith(db, 'members');
    expect(onNext).toHaveBeenCalledWith([{ name: 'Ada', id: 'a', parentId: 'team-1' }]);
  });
});
