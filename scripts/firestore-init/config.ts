import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importConfig = async () => {
  const docs: { [key: string]: object } = data.config;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing config...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('config').doc(docId), docs[docId]);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'config');
  });
};
