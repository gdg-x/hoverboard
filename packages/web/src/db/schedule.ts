import { orderBy } from 'firebase/firestore';
import type { Day } from '../models/day';
import { subscribeToCollection, type Subscription } from '../utils/firestore';

export const subscribeToSchedule = (
  onStart: () => void,
  onNext: (payload: Day[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Day>('generatedSchedule', onStart, onNext, onError, orderBy('date'));
};
