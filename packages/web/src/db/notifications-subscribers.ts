import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToDocument, type Subscription, write } from '../utils/firestore';

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

export const saveNotificationsSubscriber = (
  token: string,
  onRejected: (error: Error) => void,
): void =>
  write(
    () =>
      setDoc(doc(db, 'notificationsSubscribers', token), {
        value: true,
        updatedAt: Timestamp.now(),
      }),
    onRejected,
  );

export const removeNotificationsSubscriber = (
  token: string,
  onRejected: (error: Error) => void,
): void => write(() => deleteDoc(doc(db, 'notificationsSubscribers', token)), onRejected);
