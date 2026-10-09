import { documentId, orderBy } from 'firebase/firestore';
import type { Speaker } from '../models/speaker';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

export const subscribeToSpeakers = (
  onStart: () => void,
  onNext: (payload: Speaker[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  // In the order the build reads them, so a speaker without a `name` is kept.
  return subscribeToCollection<Speaker>(
    'speakers',
    onStart,
    onNext,
    onError,
    orderBy(documentId()),
  );
};
