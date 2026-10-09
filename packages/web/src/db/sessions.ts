import { documentId, orderBy } from 'firebase/firestore';
import type { Session } from '../models/session';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

export const subscribeToSessions = (
  onStart: () => void,
  onNext: (payload: Session[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  // Sessions have no `name`, which the collections are ordered by otherwise.
  return subscribeToCollection<Session>(
    'sessions',
    onStart,
    onNext,
    onError,
    orderBy(documentId()),
  );
};
