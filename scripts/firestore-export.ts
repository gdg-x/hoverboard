import { firestoreService } from './firebase-config';

// const [, , fileName] = process.argv;

firestoreService
  .backup('team')
  .then((data) => console.log(JSON.stringify(data)))
  .then(() => console.log('Success! 🔥'))
  .catch((error: Error) => console.log('Error! 💩', error));
