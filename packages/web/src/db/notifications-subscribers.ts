import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToDocument, Subscription } from '../utils/firestore';

export const subscribeToNotificationsSubscribers = (
  token: string,
  onStart: () => void,
  onNext: (payload: { id: string | undefined } | undefined) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToDocument<{ id: string | undefined }>(
    `notificationsSubscribers/${token}`,
    onStart,
    onNext,
    onError,
  );
};

export const saveNotificationsSubscriber = async (token: string): Promise<void> => {
  await setDoc(doc(db, 'notificationsSubscribers', token), {
    value: true,
    updatedAt: Timestamp.now(),
  });
};

export const removeNotificationsSubscriber = async (token: string): Promise<void> => {
  await deleteDoc(doc(db, 'notificationsSubscribers', token));
};
