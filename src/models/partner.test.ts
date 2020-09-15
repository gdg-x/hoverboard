import data from '../../docs/default-firebase-data.json';
import { Partner } from './partner';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const partner: Partner[] = Object.values(data['partners']);
    const keys: Array<keyof Partner> = ['logos', 'order', 'title'];
    expect(partner).toHaveLength(2);
    expect(allKeys(partner)).toStrictEqual(keys);
  });
});
