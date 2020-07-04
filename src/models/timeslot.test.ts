import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Timeslot = import('./timeslot').Timeslot;

describe('timeslot', () => {
  it('matches the shape of the default data', () => {
    const days: Timeslot[] = data['schedule']['2016-09-09']['timeslots'];
    const keys: Array<keyof Timeslot> = ['endTime', 'sessions', 'startTime'];
    expect(days).toHaveLength(13);
    expect(allKeys(days)).toStrictEqual(keys);
  });
});
