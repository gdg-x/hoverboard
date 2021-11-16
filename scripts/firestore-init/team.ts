import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importTeam = () => {
  const teams = data.team;
  if (!Object.keys(teams).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(teams).length, 'subteam...');

  const batch = firestore.batch();

  Object.keys(teams).forEach((teamId) => {
    batch.set(firestore.collection('team').doc(teamId), {
      title: teams[Number(teamId)].title,
    });

    teams[Number(teamId)].members.forEach((member, id) => {
      batch.set(
        firestore.collection('team').doc(`${teamId}`).collection('members').doc(`${id}`),
        member
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};
