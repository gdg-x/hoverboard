import { Id } from '../models/types';

export const mergeId = <T>(snapshot: firebase.firestore.QueryDocumentSnapshot): T & Id => {
  return {
    ...(snapshot.data() as T),
    ...{ id: snapshot.id },
  };
};
