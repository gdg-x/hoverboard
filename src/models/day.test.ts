import data from '../../docs/default-firebase-data.json';
import { Day } from './day';
import { allKeys } from './utils';

describe('day', () => {
  it('matches the shape of the default data', () => {
    const days: Day[] = Object.values(data['schedule']);
    const keys: Array<keyof Day> = ['date', 'dateReadable', 'timeslots', 'tracks'];
    expect(days).toHaveLength(2);
    expect(allKeys(days)).toStrictEqual(keys);
  });
});
