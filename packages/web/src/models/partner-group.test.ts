import { describe, expect, it } from 'vitest';
import partners from '../../../../docs/sample-data/collections/partners.json';
import type { PartnerGroupData } from './partner-group';
import { allKeys } from './utils';

// Partners are in the group's `items` subcollection.
type PartnerGroupDocument = Omit<PartnerGroupData, 'items'>;

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const partner: PartnerGroupDocument[] = Object.values(partners);
    const keys: Array<keyof PartnerGroupDocument> = ['order', 'title'];

    expect(partner).toHaveLength(2);
    expect(allKeys(partner)).toStrictEqual(keys);
  });
});
