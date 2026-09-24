import { orderBy } from 'firebase/firestore';
import { Session } from '../models/session';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToSessions = (
  onStart: () => void,
  onNext: (payload: Session[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Session>(
    'generatedSessions',
    onStart,
    onNext,
    onError,
    orderBy('id'),
  );
};
