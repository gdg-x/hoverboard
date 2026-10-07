import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importSpeakers = () => {
  const speakers: { [key: string]: object } = data.speakers;
  if (!Object.keys(speakers).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(speakers).length, 'speakers...');

  const batch = firestore.batch();

  Object.keys(speakers).forEach((speakerId, order) => {
    const speaker = { ...speakers[speakerId], order };
    validateContent('speakers', speakerId, speaker);
    batch.set(firestore.collection('speakers').doc(speakerId), speaker);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'speakers');
  });
};
