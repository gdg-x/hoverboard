import { DocumentData, getFirestore, QuerySnapshot } from 'firebase-admin/firestore';

export const fetchSessions = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('sessions').get();
};

/** The sessions on `day`, a `YYYY-MM-DD` date in the event time zone. */
export const fetchSessionsOn = (day: string): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('sessions').where('day', '==', day).get();
};
