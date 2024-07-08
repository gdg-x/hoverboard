import { importConfig } from './config';
import { importGallery } from './gallery';
import { importPartners } from './partners';
import { importSessions } from './sessions';
import { importSpeakers } from './speakers';
import { importTeam } from './team';
import { importTickets } from './tickets';

importConfig() // Should always be first
  .then(() => importGallery())
  .then(() => importPartners())
  .then(() => importSessions())
  .then(() => importSpeakers())
  .then(() => importTeam())
  .then(() => importTickets())
  .then(() => {
    console.log('Finished');
    process.exit();
  })
  .catch((err: Error) => {
    console.log(err);
    process.exit();
  });
