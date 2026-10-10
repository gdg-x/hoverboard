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

/** Listens to a visitor's feedback, with the sessions whose feedback the server hasn't confirmed. */
export const subscribeToFeedback = (
  userId: string,
  onNext: (payload: Feedback[], pendingSessionIds: string[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  return onSnapshot(
    query(collectionGroup(db, 'feedback'), where('userId', '==', userId)),
    { includeMetadataChanges: true },
    (snapshot) => {
      const feedback = snapshot.docs.map<Feedback>(dataWithParentId);
      onNext(
        feedback,
        feedback
          .filter((_item, index) => snapshot.docs[index]!.metadata.hasPendingWrites)
          .map(({ parentId }) => parentId),
      );
    },
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
