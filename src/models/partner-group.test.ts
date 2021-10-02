import data from '../../docs/default-firebase-data.json';
import { PartnerGroupData } from './partner-group';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const partner: PartnerGroupData[] = Object.values(data['partners']);
    const keys: Array<keyof PartnerGroupData> = ['items', 'order', 'title'];
    expect(partner).toHaveLength(2);
    expect(allKeys(partner)).toStrictEqual(keys);
  });
});
