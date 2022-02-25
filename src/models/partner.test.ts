import data from '../../docs/default-firebase-data.json';
import { PartnerData } from './partner';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const posts: PartnerData[] = Object.values(data['partners'][1]!['items']);
    const keys: Array<keyof PartnerData> = ['logoUrl', 'name', 'order', 'url'];
    expect(posts).toHaveLength(11);
    expect(allKeys(posts)).toStrictEqual(keys);
  });
});
