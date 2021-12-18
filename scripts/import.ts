/**
 * Execute this script to import `default-firebase-data.json` data into Firestore.
 */

import { importBlog } from './firestore-init/blog';
import { importConfig } from './firestore-init/config';
import { importGallery } from './firestore-init/gallery';
import { importPartners } from './firestore-init/partners';
import { importPreviousSpeakers } from './firestore-init/previous-speakers';
import { importSchedule } from './firestore-init/schedule';
import { importSessions } from './firestore-init/sessions';
import { importSpeakers } from './firestore-init/speakers';
import { importTeam } from './firestore-init/team';
import { importTickets } from './firestore-init/tickets';
import { importVideos } from './firestore-init/videos';

console.log('Importing default data to Firestore');

importConfig()
  .then(() => importBlog())
  .then(() => importGallery())
  .then(() => importPartners())
  .then(() => importPreviousSpeakers())
  .then(() => importSchedule())
  .then(() => importSessions())
  .then(() => importSpeakers())
  .then(() => importTeam())
  .then(() => importTickets())
  .then(() => importVideos())
  .then(() => {
    console.log('Finished');
    process.exit();
  })
  .catch((err: Error) => {
    console.log(err);
    process.exit();
  });
