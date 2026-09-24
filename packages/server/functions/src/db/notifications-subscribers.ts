import { DocumentData, getFirestore, QuerySnapshot, WriteResult } from 'firebase-admin/firestore';

export const fetchNotificationSubscribers = (): Promise<QuerySnapshot<DocumentData>> => {
  return getFirestore().collection('notificationsSubscribers').get();
};

export const deleteNotificationSubscriber = (token: string): Promise<WriteResult> => {
  return getFirestore().collection('notificationsSubscribers').doc(token).delete();
};
