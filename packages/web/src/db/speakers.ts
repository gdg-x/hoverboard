import { SpeakerWithTags } from '../models/speaker';
import { subscribeToCollection, Subscription } from '../utils/firestore';

export const subscribeToSpeakers = (
  onStart: () => void,
  onNext: (payload: SpeakerWithTags[]) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToCollection<SpeakerWithTags>('generatedSpeakers', onStart, onNext, onError);
};
