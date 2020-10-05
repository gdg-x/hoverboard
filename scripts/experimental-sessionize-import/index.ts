import { importSchedule } from './schedule';
import { importSessions } from './sessions';
import { importSpeakers } from './speakers';

// TODO: accept sessionize file as a param
// TODO: support not having a schedule
// TODO: support multiple tracks on multiple days

importSpeakers()
  .then(() => importSessions())
  .then(() => importSchedule())
  .then(() => {
    console.log('Finished');
    process.exit();
  })
  .catch((err: Error) => {
    console.log(err);
    process.exit();
  });
