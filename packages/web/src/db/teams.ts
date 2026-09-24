import { orderBy } from 'firebase/firestore';
import { TeamWithoutMembers } from '../models/team';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToTeams = (
  onStart: () => void,
  onNext: (payload: TeamWithoutMembers[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<TeamWithoutMembers>(
    'team',
    onStart,
    onNext,
    onError,
    orderBy('title'),
  );
};
