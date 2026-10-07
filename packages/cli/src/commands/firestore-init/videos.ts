import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importVideos = () => {
  const docs = data.videos;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing videos...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId: string) => {
    const id = docId.padStart(3, '0');
    const video = { ...docs[Number(docId)], order: docId };
    validateContent('videos', id, video);
    batch.set(firestore.collection('videos').doc(id), video);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'videos');
  });
};
