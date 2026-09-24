import { getData, saveData } from './utils.js';

export const runFirestoreCopy = async (source: string, destination: string): Promise<void> => {
  const data = await getData(source);
  await saveData(data, destination);
};
