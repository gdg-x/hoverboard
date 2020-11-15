import data from '../../docs/default-firebase-data.json';
import { PartnerGroup } from './partner-group';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const partner: PartnerGroup[] = Object.values(data['partners']);
    const keys: Array<keyof PartnerGroup> = ['items', 'order', 'title'];
    expect(partner).toHaveLength(2);
    expect(allKeys(partner)).toStrictEqual(keys);
  });
});
