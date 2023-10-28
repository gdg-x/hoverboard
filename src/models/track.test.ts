import data from '../../docs/default-firebase-data.json';
import { Track } from './track';
import { allKeys } from './utils';

describe('track', () => {
  it('matches the shape of the default data', () => {
    const days: Track[] = data['schedule']['2016-09-09']['tracks'];
    const keys: Array<keyof Track> = ['title'];
    expect(days).toHaveLength(3);
    expect(allKeys(days)).toStrictEqual(keys);
  });
});
