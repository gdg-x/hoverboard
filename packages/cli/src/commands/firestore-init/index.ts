import { importBlog } from './blog.js';
import { importConfig } from './config.js';
import { importGallery } from './gallery.js';
import { importPartners } from './partners.js';
import { importPreviousSpeakers } from './previous-speakers.js';
import { importSchedule } from './schedule.js';
import { importSessions } from './sessions.js';
import { importSpeakers } from './speakers.js';
import { importTeam } from './team.js';
import { importTickets } from './tickets.js';
import { importVideos } from './videos.js';

export const runFirestoreInit = async (): Promise<void> => {
  await importConfig(); // Should always be first
  await importBlog();
  await importGallery();
  await importPartners();
  await importPreviousSpeakers();
  await importSchedule();
  await importSessions();
  await importSpeakers();
  await importTeam();
  await importTickets();
  await importVideos();
  console.log('Finished');
};
