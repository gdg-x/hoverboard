import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importPartners = () => {
  const partners = data.partners;
  if (!Object.keys(partners).length) {
    return Promise.resolve();
  }
  console.log('Importing partners...');

  const batch = firestore.batch();

  Object.keys(partners).forEach((docId) => {
    batch.set(firestore.collection('partners').doc(docId), {
      title: partners[Number(docId)].title,
      order: partners[Number(docId)].order,
    });

    partners[Number(docId)].items.forEach((item, id) => {
      batch.set(
        firestore
          .collection('partners')
          .doc(`${docId}`)
          .collection('items')
          .doc(`${id}`.padStart(3, '0')),
        item
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};
