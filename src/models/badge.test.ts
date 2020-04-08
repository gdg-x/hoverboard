import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Badge = import('./badge').Badge;

describe('badge', () => {
  it('matches the shape of the default data', () => {
    const badges: Badge[] = Object.values(data['speakers']['dmytro_danylyk']['badges']);
    const keys: Array<keyof Badge> = ['description', 'link', 'name'];
    expect(badges).toHaveLength(2);
    expect(allKeys(badges)).toStrictEqual(keys);
  });
});
