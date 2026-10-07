import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

export const importTickets = () => {
  const docs = data.tickets;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing tickets...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId: string) => {
    const id = docId.padStart(3, '0');
    const ticket = { ...docs[Number(docId)], order: docId };
    validateContent('tickets', id, ticket);
    batch.set(firestore.collection('tickets').doc(id), ticket);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'tickets');
  });
};
