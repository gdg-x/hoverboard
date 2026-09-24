import { PreviousSpeaker } from '../models/previous-speaker';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToPreviousSpeakers = (
  onStart: () => void,
  onNext: (payload: PreviousSpeaker[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<PreviousSpeaker>('previousSpeakers', onStart, onNext, onError);
};
