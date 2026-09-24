import { orderBy } from 'firebase/firestore';
import { Day } from '../models/day';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToSchedule = (
  onStart: () => void,
  onNext: (payload: Day[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<Day>('generatedSchedule', onStart, onNext, onError, orderBy('date'));
};
