import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

const computeFunding = functions.firestore.document('/projects/{id}').onUpdate((snapshot) => {

	var projectData = snapshot.after;
	console.log(projectData);
	console.log("data: " + projectData.data());
	console.log("id: " + projectData.id);

	var value = projectData.data();

	Object.assign(value, {matching: 888});

	return firestore().collection('projects').doc(projectData.id).set(value);
});

// const saveUserData = auth.user().onCreate((userRecord) => {
//   const uid = userRecord.uid || userRecord.providerData[0].uid;
//   const userData = {
//     email: userRecord.email || userRecord.providerData[0].email || '',
//     displayName: userRecord.displayName || userRecord.providerData[0].displayName || '',
//     photoURL: userRecord.photoURL || userRecord.providerData[0].photoURL || ''
//   };

//   return firestore().collection('users').doc(uid).set(userData);
// });

export default computeFunding;
