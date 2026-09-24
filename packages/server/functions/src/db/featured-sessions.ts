import { DocumentData, getFirestore, QuerySnapshot } from 'firebase-admin/firestore';

export const fetchFeaturedSessions = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('featuredSessions').get();
};
