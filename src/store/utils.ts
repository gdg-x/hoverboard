import { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore-types';
import { Id } from '../models/types';

export const mergeId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T & Id => {
  return {
    ...(snapshot.data() as T),
    ...{ id: snapshot.id },
  };
};

interface Orderable {
  order: number;
}

export const order = <A extends Orderable, B extends Orderable>(a: A, b: B) => a.order - b.order;
