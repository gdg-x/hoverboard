import { importBlog } from './blog';
import { importGallery } from './gallery';
import { importPartners } from './partners';
import { importTeam } from './team';
import { importTickets } from './tickets';
import { importVideos } from './videos';

importBlog()
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
