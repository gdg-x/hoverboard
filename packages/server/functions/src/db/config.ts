import { DocumentData, DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';

export const fetchConfig = <T = DocumentData>(id: string): Promise<DocumentSnapshot<T>> => {
  return getFirestore().collection('config').doc(id).get() as Promise<DocumentSnapshot<T>>;
};
