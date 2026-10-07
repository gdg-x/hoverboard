import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importSchedule = () => {
  const docs: { [key: string]: object } = data.schedule;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing schedule...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    const day = { ...docs[docId], date: docId };
    validateContent('schedule', docId, day);
    batch.set(firestore.collection('schedule').doc(docId), day);
  });

  return batch.commit().then(() => {
    console.log('Imported data for', Object.keys(docs).length, 'days');
  });
};
