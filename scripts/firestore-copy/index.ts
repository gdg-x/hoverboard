import { getData, saveData } from './utils';

const [, , source, destination] = process.argv;

if (!source || !destination) {
  throw new Error('source and destination parameters are required');
}

getData(source)
  .then((data) => saveData(data, destination))
  .then(() => console.log('Success! 🔥'))
  .catch((error) => console.log('Error! 💩', error));
