import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Feedback, FeedbackId } from '../models/feedback';
import { dataWithParentId, write } from '../utils/firestore';

export const subscribeToFeedback = (
  userId: string,
  onNext: (payload: Feedback[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  return onSnapshot(
    query(collectionGroup(db, 'feedback'), where('userId', '==', userId)),
    (snapshot) => onNext(snapshot.docs.map<Feedback>(dataWithParentId)),
    (error) => onError(error as Error),
  );
};

export const saveFeedback = (data: Feedback, onRejected: (error: Error) => void): void =>
  write(
    () =>
      setDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId), {
        contentRating: data.contentRating,
        styleRating: data.styleRating,
        comment: data.comment,
        userId: data.userId,
      }),
    onRejected,
  );

export const removeFeedback = (data: FeedbackId, onRejected: (error: Error) => void): void =>
  write(() => deleteDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId)), onRejected);
