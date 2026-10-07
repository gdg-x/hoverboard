import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importPartners = () => {
  const partners = data.partners;
  if (!Object.keys(partners).length) {
    return Promise.resolve();
  }
  console.log('Importing partners...');

  const batch = firestore.batch();

  Object.keys(partners).forEach((partnerId) => {
    const partner = partners[Number(partnerId)];
    if (partner) {
      const group = { title: partner.title, order: partner.order };
      validateContent('partners', partnerId, group);
      batch.set(firestore.collection('partners').doc(partnerId), group);

      partner.items.forEach((item, id) => {
        const itemId = `${id}`.padStart(3, '0');
        validateContent(`partners/${partnerId}/items`, itemId, item);
        batch.set(
          firestore.collection('partners').doc(`${partnerId}`).collection('items').doc(itemId),
          item,
        );
      });
    } else {
      console.warn(`Missing partner ${partnerId}`);
    }
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};
