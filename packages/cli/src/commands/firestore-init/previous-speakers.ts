import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importPreviousSpeakers = () => {
  const previousSpeakers: { [key: string]: object } = data.previousSpeakers;
  if (!Object.keys(previousSpeakers).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(previousSpeakers).length, 'previous speakers...');

  const batch = firestore.batch();

  Object.keys(previousSpeakers).forEach((speakerId, order) => {
    const speaker = { ...previousSpeakers[speakerId], order };
    validateContent('previousSpeakers', speakerId, speaker);
    batch.set(firestore.collection('previousSpeakers').doc(speakerId), speaker);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'previous speakers');
  });
};
