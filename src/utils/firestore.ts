import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Id } from '../models/types';

export const mergeDataAndId = <T>(snapshot: QueryDocumentSnapshot<DocumentData>): T & Id => {
  return {
    ...(snapshot.data() as T),
    id: snapshot.id,
  };
};
