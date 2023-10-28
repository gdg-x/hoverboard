import data from '../../docs/default-firebase-data.json';
import { Time } from './time';
import { allKeys } from './utils';

describe('time', () => {
  it('matches the shape of the default data', () => {
    const times: Time[] = data['schedule']['2016-09-09']['timeslots'][3]!['sessions'];
    const keys: Array<keyof Time> = ['extend', 'items'];
    expect(times).toHaveLength(3);
    expect(allKeys(times)).toStrictEqual(keys);
  });
});
