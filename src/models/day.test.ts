import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Day = import('./day').Day;

describe('day', () => {
  it('matches the shape of the default data', () => {
    const days: Day[] = Object.values(data['schedule']);
    const keys: Array<keyof Day> = ['dateReadable', 'timeslots', 'tracks'];
    expect(days).toHaveLength(2);
    expect(allKeys(days)).toStrictEqual(keys);
  });
});
