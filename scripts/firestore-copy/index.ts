import { getData, saveData } from './utils';

const [, , source, destination] = process.argv;

getData(source)
  .then((data) => saveData(data, destination))
  .then(() => console.log('Success! 🔥'))
  .catch((error) => console.log('Error! 💩', error));
