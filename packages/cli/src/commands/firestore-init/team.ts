import { validateContent } from '../../lib/content.js';
import { firestore } from '../../lib/firestore.js';
import data from '../../../../../docs/default-firebase-data.json';

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
      const teamDoc = { title: team.title };
      validateContent('team', teamId, teamDoc);
      batch.set(firestore.collection('team').doc(teamId), teamDoc);

      team.members.forEach((member, id) => {
        validateContent(`team/${teamId}/members`, `${id}`, member);
        batch.set(
          firestore.collection('team').doc(`${teamId}`).collection('members').doc(`${id}`),
          member,
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
