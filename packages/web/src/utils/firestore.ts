import { type RemoteData, Success } from '@abraham/remotedata';
import {
  collection,
  collectionGroup,
  doc,
  type DocumentData,
  DocumentSnapshot,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Id, ParentId } from '../models/types';

export const mergeDataAndId = <T>(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): T & Id => {
  return {
    ...(snapshot.data() as T),
    id: snapshot.id,
  };
};

export const dataWithParentId = <T>(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): T & ParentId => {
  return {
    ...(snapshot.data() as T),
    parentId: (snapshot.ref.parent.parent as Id).id,
    id: snapshot.id,
  };
};

export type Subscription = RemoteData<Error, Unsubscribe>;

/**
 * Starts a write without waiting for the server. Firestore applies it to the cache, and so to its
 * listeners, at once, and sends it whenever it can. `onRejected` runs if the server refuses it, for
 * example a rule. A write that waits because the client is offline doesn't reject.
 */
export const write = (run: () => Promise<unknown>, onRejected: (error: Error) => void): void => {
  const reject = (error: unknown) =>
    onRejected(error instanceof Error ? error : new Error(String(error)));
  try {
    run().catch(reject);
  } catch (error) {
    reject(error);
  }
};

/** What a snapshot says beyond its data. */
export interface SnapshotState {
  /** The document has local writes the server hasn't confirmed yet, such as ones made offline. */
  pending: boolean;
}

/** Listens to a document, and to its metadata, so a write the server confirms updates `pending`. */
export const subscribeToDocument = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T | undefined, state: SnapshotState) => void,
  onError: (error: Error) => void,
): Subscription => {
  const unsubscribe = onSnapshot(
    doc(db, path),
    { includeMetadataChanges: true },
    (snapshot) =>
      onNext(snapshot.exists() ? mergeDataAndId(snapshot) : undefined, {
        pending: snapshot.metadata.hasPendingWrites,
      }),
    (payload) => onError(payload),
  );

  onStart();
  return new Success(unsubscribe);
};

export const subscribeToCollection = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T[]) => void,
  onError: (error: Error) => void,
  order = orderBy('name'),
): Subscription => {
  const unsubscribe = onSnapshot(
    query(collection(db, path), order),
    (snapshot) => onNext(snapshot.docs.map<T>(mergeDataAndId)),
    (payload) => onError(payload),
  );

  onStart();
  return new Success(unsubscribe);
};

export const subscribeToCollectionGroup = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T[]) => void,
  onError: (error: Error) => void,
  order = orderBy('name'),
): Subscription => {
  const unsubscribe = onSnapshot(
    query(collectionGroup(db, path), order),
    (snapshot) => onNext(snapshot.docs.map<T>(dataWithParentId)),
    (payload) => onError(payload),
  );

  onStart();
  return new Success(unsubscribe);
};
