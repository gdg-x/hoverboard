import { initializeFirebase } from './firebase-config';
import { getData, saveData } from './firestore-utils';

initializeFirebase()
  .then(() => getData(process.argv[2]))
  .then((data) => saveData(data, process.argv[3]))
  .then(() => console.log('Success! 🔥'))
  .catch((error) => console.log('Error! 💩', error));
