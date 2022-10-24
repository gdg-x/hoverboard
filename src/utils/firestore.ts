import { RemoteData, Success } from '@abraham/remotedata';
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
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Id, ParentId } from '../models/types';

export const mergeDataAndId = <T>(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): T & Id => {
  return {
    ...(snapshot.data() as T),
    id: snapshot.id,
  };
};

export const dataWithParentId = <T>(
  snapshot: QueryDocumentSnapshot<DocumentData>
): T & ParentId => {
  return {
    ...(snapshot.data() as T),
    parentId: (snapshot.ref.parent.parent as Id).id,
    id: snapshot.id,
  };
};

export type Subscription = RemoteData<Error, Unsubscribe>;

export const subscribeToDocument = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T | undefined) => void,
  onError: (error: Error) => void
): Subscription => {
  const unsubscribe = onSnapshot(
    doc(db, path),
    (snapshot) => onNext(snapshot.exists() ? mergeDataAndId(snapshot) : undefined),
    (payload) => onError(payload)
  );

  onStart();
  return new Success(unsubscribe);
};

export const subscribeToCollection = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T[]) => void,
  onError: (error: Error) => void,
  order = orderBy('name')
): Subscription => {
  const unsubscribe = onSnapshot(
    query(collection(db, path), order),
    (snapshot) => onNext(snapshot.docs.map<T>(mergeDataAndId)),
    (payload) => onError(payload)
  );

  onStart();
  return new Success(unsubscribe);
};

export const subscribeToCollectionGroup = <T>(
  path: string,
  onStart: () => void,
  onNext: (payload: T[]) => void,
  onError: (error: Error) => void,
  order = orderBy('name')
): Subscription => {
  const unsubscribe = onSnapshot(
    query(collectionGroup(db, path), order),
    (snapshot) => onNext(snapshot.docs.map<T>(dataWithParentId)),
    (payload) => onError(payload)
  );

  onStart();
  return new Success(unsubscribe);
};
