import { describe, expect, it } from 'vitest';
import items from '../../../../docs/sample-data/collections/partners--items.json';
import type { PartnerData } from './partner';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const posts: PartnerData[] = Object.entries(items)
      .filter(([path]) => path.startsWith('partners/1/'))
      .map(([, item]) => item);
    const keys: Array<keyof PartnerData> = ['logoUrl', 'name', 'order', 'url'];

    expect(posts).toHaveLength(11);
    expect(allKeys(posts)).toStrictEqual(keys);
  });
});
