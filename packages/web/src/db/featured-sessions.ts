import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Id } from '../models/types';
import {
  type SnapshotState,
  type Subscription,
  subscribeToDocument,
  write,
} from '../utils/firestore';

export interface FeaturedSessions {
  [sessionId: string]: boolean;
}

/** Listens to a visitor's bookmarks, so writes from this tab, other tabs and the server show. */
export const subscribeToFeaturedSessions = (
  userId: string,
  onStart: () => void,
  onNext: (featuredSessions: FeaturedSessions, state: SnapshotState) => void,
  onError: (error: Error) => void,
): Subscription =>
  subscribeToDocument<FeaturedSessions>(
    `featuredSessions/${userId}`,
    onStart,
    (document, state) => {
      // The helper adds the document ID, which isn't a bookmark.
      const { id: _id, ...featuredSessions } = (document ?? {}) as FeaturedSessions & Partial<Id>;
      onNext(featuredSessions, state);
    },
    onError,
  );

export const saveFeaturedSessions = (
  userId: string,
  featuredSessions: FeaturedSessions,
  onRejected: (error: Error) => void,
): void => write(() => setDoc(doc(db, 'featuredSessions', userId), featuredSessions), onRejected);
