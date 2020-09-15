import data from '../../docs/default-firebase-data.json';
import { Social } from './social';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const socials: Social[] = Object.values(data['speakers']['aleksander_piotrowski']['socials']);
    const keys: Array<keyof Social> = ['icon', 'link', 'name'];
    expect(socials).toHaveLength(4);
    expect(allKeys(socials)).toStrictEqual(keys);
  });
});
