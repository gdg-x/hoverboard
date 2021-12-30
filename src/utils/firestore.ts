import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Id, ParentId } from '../models/types';

export const mergeDataAndId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T & Id => {
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
