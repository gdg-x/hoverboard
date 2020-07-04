/**
 * Execute this script to import the `default-firebase-data.json` data
 *   into the local emulator suite db for `hoverboad-dev`.
 */

import data from '../docs/default-firebase-data.json';
import {
  importBlog,
  importGallery,
  importNotificationsConfig,
  importPartners,
  importPreviousSpeakers,
  importSchedule,
  importSessions,
  importSpeakers,
  importTeam,
  importTickets,
  importVideos,
} from './import-collections';
import { firestore, initializeFirebase } from './firebase-config-local';

initializeFirebase()
  .then(() => importBlog(firestore, data))
  .then(() => importGallery(firestore, data))
  .then(() => importNotificationsConfig(firestore, data))
  .then(() => importPartners(firestore, data))
  .then(() => importPreviousSpeakers(firestore, data))
  .then(() => importSchedule(firestore, data))
  .then(() => importSessions(firestore, data))
  .then(() => importSpeakers(firestore, data))
  .then(() => importTeam(firestore, data))
  .then(() => importTickets(firestore, data))
  .then(() => importVideos(firestore, data))

  .then(() => {
    console.log('Finished');
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });
