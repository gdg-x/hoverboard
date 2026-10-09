import { DocumentData, getFirestore, QuerySnapshot } from 'firebase-admin/firestore';

export const fetchSchedule = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('schedule').orderBy('date', 'desc').get();
};
