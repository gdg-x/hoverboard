import { collectionInfo } from '../../../../storage/collections.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importConfig = async (features: Record<string, boolean> = {}) => {
  // Documents Hoverboard doesn't use, such as `config/site`, are always seeded.
  const isNeeded = (docId: string) =>
    collectionInfo(`config/${docId}`)?.features.some((name) => features[name] !== false) ?? true;
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
