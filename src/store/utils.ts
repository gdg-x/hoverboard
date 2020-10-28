import { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore-types';
import { Id } from '../models/types';

export const mergeId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T & Id => {
  return {
    ...(snapshot.data() as T),
    ...{ id: snapshot.id },
  };
};
