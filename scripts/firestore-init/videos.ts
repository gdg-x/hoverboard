import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importVideos = () => {
  const docs = data.videos;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing videos...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId: string) => {
    batch.set(firestore.collection('videos').doc(docId.padStart(3, '0')), {
      ...docs[Number(docId)],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'videos');
  });
};
