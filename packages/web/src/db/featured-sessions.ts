import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface FeaturedSessions {
  [sessionId: string]: boolean;
}

export const fetchFeaturedSessions = async (userId: string): Promise<FeaturedSessions> => {
  const snapshot = await getDoc(doc(db, 'featuredSessions', userId));
  return snapshot.data() || {};
};

export const saveFeaturedSessions = async (
  userId: string,
  featuredSessions: FeaturedSessions,
): Promise<void> => {
  await setDoc(doc(db, 'featuredSessions', userId), featuredSessions);
};
