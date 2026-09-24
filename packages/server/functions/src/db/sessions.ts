import {
  DocumentData,
  DocumentSnapshot,
  getFirestore,
  QuerySnapshot,
} from 'firebase-admin/firestore';

export const fetchSessions = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('sessions').get();
};

export const fetchSession = (id: string): Promise<DocumentSnapshot<DocumentData>> => {
  return getFirestore().collection('sessions').doc(id).get();
};
