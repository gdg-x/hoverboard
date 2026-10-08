import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

// Config documents that only a function of these features reads. The others are always seeded.
const DOC_FEATURES: Record<string, string[]> = {
  mailchimp: ['mailchimp'],
  notifications: ['notifications'],
  schedule: ['schedule', 'speakers'],
};

export const importConfig = async (features: Record<string, boolean> = {}) => {
  const isNeeded = (docId: string) =>
    DOC_FEATURES[docId]?.some((name) => features[name] !== false) ?? true;
  const docs: { [key: string]: object } = Object.fromEntries(
    Object.entries(data.config).filter(([docId]) => isNeeded(docId)),
  );
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
