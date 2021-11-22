import { importBlog } from './blog';
import { importGallery } from './gallery';
import { importNotificationsConfig } from './notifications-config';
import { importPartners } from './partners';
import { importPreviousSpeakers } from './previous-speakers';
import { importSchedule } from './schedule';
import { importSessions } from './sessions';
import { importSpeakers } from './speakers';
import { importTeam } from './team';
import { importTickets } from './tickets';
import { importVideos } from './videos';

importBlog()
  .then(() => importGallery())
  .then(() => importNotificationsConfig())
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
