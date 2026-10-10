import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Reaction, ReactionId } from '../models/reaction';
import { write } from '../utils/firestore';

interface StoredReaction {
  reactions: ReactionId[];
  userId: string;
  updatedAt?: Timestamp | null;
}

// A pending write has no server time yet, so it takes the local estimate and sorts as newest.
const toReaction = (snapshot: QueryDocumentSnapshot): Reaction => {
  const { reactions, userId, updatedAt } = snapshot.data({
    serverTimestamps: 'estimate',
  }) as StoredReaction;
  return {
    id: snapshot.id,
    reactions,
    userId,
    ...(updatedAt && { updatedAt: updatedAt.toDate() }),
  };
};

export const newestFirst = (a: Reaction, b: Reaction): number =>
  (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);

/** Listens to everyone's reactions to a session, newest first. */
export const subscribeToReactions = (
  sessionId: string,
  onNext: (reactions: Reaction[]) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    collection(db, 'sessions', sessionId, 'reactions'),
    (snapshot) => onNext(snapshot.docs.map(toReaction).sort(newestFirst)),
    (error) => onError(error),
  );

/** The visitor's own reactions, by session ID. */
export type OwnReactions = Record<string, ReactionId[]>;

/** Listens to the visitor's reactions in every session, and whether some haven't synced. */
export const subscribeToOwnReactions = (
  userId: string,
  onNext: (reactions: OwnReactions, pending: boolean, fromServer: boolean) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collectionGroup(db, 'reactions'), where('userId', '==', userId)),
    { includeMetadataChanges: true },
    (snapshot) =>
      onNext(
        Object.fromEntries(
          snapshot.docs.map((reaction) => [
            reaction.ref.parent.parent!.id,
            (reaction.data() as StoredReaction).reactions,
          ]),
        ),
        snapshot.metadata.hasPendingWrites,
        !snapshot.metadata.fromCache,
      ),
    (error) => onError(error),
  );

/** Saves the visitor's reactions to a session. No reactions deletes the document. */
export const saveReactions = (
  sessionId: string,
  userId: string,
  reactions: ReactionId[],
  onRejected: (error: Error) => void,
): void => {
  const reference = doc(db, 'sessions', sessionId, 'reactions', userId);
  if (reactions.length) {
    write(() => setDoc(reference, { reactions, userId, updatedAt: serverTimestamp() }), onRejected);
  } else {
    write(() => deleteDoc(reference), onRejected);
  }
};
