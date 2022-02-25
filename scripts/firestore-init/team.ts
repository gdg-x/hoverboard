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
    const team = teams[Number(teamId)];
    if (team) {
      batch.set(firestore.collection('team').doc(teamId), {
        title: team.title,
      });

      team.members.forEach((member, id) => {
        batch.set(
          firestore.collection('team').doc(`${teamId}`).collection('members').doc(`${id}`),
          member
        );
      });
    } else {
      console.warn(`Skipping missing team ${teamId}`);
    }
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};
