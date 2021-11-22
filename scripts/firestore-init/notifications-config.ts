import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importNotificationsConfig = async () => {
  const notificationsConfig = data.notifications.config;
  console.log('Migrating notifications config...');
  const batch = firestore.batch();

  batch.set(firestore.collection('config').doc('notifications'), notificationsConfig);

  return batch.commit().then(() => {
    console.log('Imported data for notifications config');
  });
};
