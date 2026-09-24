import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Feedback, FeedbackId } from '../models/feedback';
import { dataWithParentId } from '../utils/firestore';

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

export const saveFeedback = async (data: Feedback): Promise<FeedbackId> => {
  await setDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId), {
    contentRating: data.contentRating,
    styleRating: data.styleRating,
    comment: data.comment,
    userId: data.userId,
  });

  return {
    parentId: data.parentId,
    userId: data.userId,
    id: data.userId,
  };
};

export const removeFeedback = async (data: FeedbackId): Promise<FeedbackId> => {
  await deleteDoc(doc(db, 'sessions', data.parentId, 'feedback', data.userId));
  return data;
};
