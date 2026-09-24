import { DocumentData, getFirestore, QuerySnapshot } from 'firebase-admin/firestore';

export const fetchSpeakers = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('speakers').get();
};
