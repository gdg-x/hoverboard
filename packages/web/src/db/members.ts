import type { Member } from '../models/member';
import { subscribeToCollectionGroup, type Subscription } from '../utils/firestore';

export const subscribeToMembers = (
  onStart: () => void,
  onNext: (payload: Member[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollectionGroup<Member>('members', onStart, onNext, onError);
};
