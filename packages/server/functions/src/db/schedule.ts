import { DocumentData, getFirestore, QuerySnapshot } from 'firebase-admin/firestore';

export const fetchSchedule = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('schedule').orderBy('date', 'desc').get();
};

export const getSchedule = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('schedule').get();
};
