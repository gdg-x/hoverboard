import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importGallery = () => {
  const gallery: string[] = data.gallery;
  if (!Object.keys(gallery).length) {
    return undefined;
  }
  console.log('Importing gallery...');

  const batch = firestore.batch();

  Object.keys(gallery).forEach((docId: string) => {
    const id = docId.padStart(3, '0');
    const photo = { url: gallery[Number(docId)], order: docId };
    validateContent('gallery', id, photo);
    batch.set(firestore.collection('gallery').doc(id), photo);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'images');
  });
};
