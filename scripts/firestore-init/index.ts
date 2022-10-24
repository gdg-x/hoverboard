import { importBlog } from './blog';
import { importConfig } from './config';
import { importGallery } from './gallery';
import { importPartners } from './partners';
import { importTeam } from './team';
import { importTickets } from './tickets';
import { importVideos } from './videos';

importConfig() // Should always be first
  .then(() => importBlog())
  .then(() => importGallery())
  .then(() => importPartners())
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
