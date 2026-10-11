import { collectionInfo } from '../../../../storage/collections.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

/** The `config` documents the seed writes: those of features that are on, and any outside the registry. */
export const seededConfig = (features: Record<string, boolean> = {}): string[] =>
  Object.keys(data.config).filter(
    (docId) =>
      collectionInfo(`config/${docId}`)?.features.some((name) => features[name] !== false) ?? true,
  );

export const importConfig = async (features: Record<string, boolean> = {}) => {
  const docs: { [key: string]: object } = Object.fromEntries(
    Object.entries(data.config).filter(([docId]) => seededConfig(features).includes(docId)),
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
