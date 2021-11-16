import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importSchedule = () => {
  const docs: { [key: string]: object } = data.schedule;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing schedule...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('schedule').doc(docId), {
      ...docs[docId],
      date: docId,
    });
  });

  return batch.commit().then(() => {
    console.log('Imported data for', Object.keys(docs).length, 'days');
  });
};
