import { importBlog } from './blog';
import { importConfig } from './config';
import { importGallery } from './gallery';
import { importPartners } from './partners';
import { importTickets } from './tickets';
import { importVideos } from './videos';

importBlog()
  .then(() => importConfig())
  .then(() => importGallery())
  .then(() => importPartners())
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
