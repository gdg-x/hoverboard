import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importBlog = () => {
  const blog: { [key: string]: object } = data.blog;
  if (!Object.keys(blog).length) {
    return Promise.resolve();
  }
  console.log('Importing blog...');

  const batch = firestore.batch();

  Object.keys(blog).forEach((docId: string) => {
    batch.set(firestore.collection('blog').doc(docId), blog[docId]);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'blog posts');
  });
};
