import {
  collection,
  deleteDoc,
  doc,
  documentId,
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
import type { Profile, ProfileData } from '../models/profile';
import {
  type SnapshotState,
  type Subscription,
  subscribeToDocument,
  write,
} from '../utils/firestore';

/** Firestore's limit on the values of an `in` filter. */
export const MAX_PROFILES = 30;

interface StoredProfile {
  name: string;
  photoUrl: string;
  updatedAt?: Timestamp | null;
}

const toProfile = (id: string, { name, photoUrl, updatedAt }: StoredProfile): Profile => ({
  id,
  name,
  photoUrl,
  ...(updatedAt && { updatedAt: updatedAt.toDate() }),
});

/** Listens to the visitor's own profile, which doesn't exist until they first react. */
export const subscribeToOwnProfile = (
  userId: string,
  onStart: () => void,
  onNext: (profile: Profile | undefined, state: SnapshotState) => void,
  onError: (error: Error) => void,
): Subscription =>
  subscribeToDocument<StoredProfile>(
    `profiles/${userId}`,
    onStart,
    (profile, state) => onNext(profile && toProfile(userId, profile), state),
    onError,
  );

/** Listens to the profiles of up to `MAX_PROFILES` users. Profiles that don't exist are left out. */
export const subscribeToProfiles = (
  userIds: readonly string[],
  onNext: (profiles: Profile[]) => void,
  onError: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'profiles'), where(documentId(), 'in', userIds.slice(0, MAX_PROFILES))),
    (snapshot) =>
      onNext(
        snapshot.docs.map((profile: QueryDocumentSnapshot) =>
          toProfile(profile.id, profile.data({ serverTimestamps: 'estimate' }) as StoredProfile),
        ),
      ),
    (error) => onError(error),
  );

export const saveProfile = (
  userId: string,
  { name, photoUrl }: Pick<ProfileData, 'name' | 'photoUrl'>,
  onRejected: (error: Error) => void,
): void =>
  write(
    () => setDoc(doc(db, 'profiles', userId), { name, photoUrl, updatedAt: serverTimestamp() }),
    onRejected,
  );

/**
 * Deletes the visitor's reactions in each of `sessionIds`, then their profile. The writes queue in
 * order, offline too, so the reactions are gone before the profile.
 */
export const deleteProfile = (
  userId: string,
  sessionIds: readonly string[],
  onRejected: (error: Error) => void,
): void => {
  for (const sessionId of sessionIds) {
    write(() => deleteDoc(doc(db, 'sessions', sessionId, 'reactions', userId)), onRejected);
  }
  write(() => deleteDoc(doc(db, 'profiles', userId)), onRejected);
};
