import { Member } from '../models/member';
import { subscribeToCollectionGroup, Subscription } from '../utils/firestore';

export const subscribeToMembers = (
  onStart: () => void,
  onNext: (payload: Member[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollectionGroup<Member>('members', onStart, onNext, onError);
};
