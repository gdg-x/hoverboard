import data from '../../docs/default-firebase-data.json';
import { Logo } from './logo';
import { allKeys } from './utils';

describe('logo', () => {
  it('matches the shape of the default data', () => {
    const posts: Logo[] = Object.values(data['partners'][1]['logos']);
    const keys: Array<keyof Logo> = ['logoUrl', 'name', 'order', 'url'];
    expect(posts).toHaveLength(11);
    expect(allKeys(posts)).toStrictEqual(keys);
  });
});
