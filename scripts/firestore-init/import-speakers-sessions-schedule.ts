import admin, { ServiceAccount } from 'firebase-admin';
import fs from "fs"

const serviceAccount = process.env.firebaseServiceAccount
const credential = admin.credential.cert(serviceAccount as ServiceAccount);
admin.initializeApp({ credential });
const firestore = admin.firestore();

const fileName = `${__dirname}/../../data/sessions-speakers-schedule.json`
const rawFileContent = fs.readFileSync(fileName, 'utf8')
const fileContent = JSON.parse(rawFileContent)

// Duplicate of index.ts to import only the speakers, sessions and schedule from a GitHub Action

export const importSpeakers = () => {
  const speakers: { [key: string]: object } = fileContent.speakers;
  if (!Object.keys(speakers).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(speakers).length, 'speakers...');
  const batch = firestore.batch();
  Object.keys(speakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('speakers').doc(speakerId), {
      ...speakers[speakerId],
      order,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'speakers');
  });
};
export const importSessions = () => {
  const docs: { [key: string]: object } = fileContent.sessions;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing sessions...');
  const batch = firestore.batch();
  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('sessions').doc(docId), docs[docId]);
  });
  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'sessions');
  });
};
export const importSchedule = () => {
  const docs: { [key: string]: object } = fileContent.schedule;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing schedule...');
  const batch = firestore.batch();
  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('schedule').doc(docId), {
      ...docs[docId],
      date: docId,
    });
  });
  return batch.commit().then(() => {
    console.log('Imported data for', Object.keys(docs).length, 'days');
  });
};

importSchedule()
  .then(() => importSessions())
  .then(() => importSpeakers())
  .then(() => {
    console.log('Finished');
    process.exit();
  })
  .catch((err: Error) => {
    console.log(err);
    process.exit();
  });
