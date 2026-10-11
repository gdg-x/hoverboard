import { describe, expect, it } from 'vitest';
import speakers from '../../../../docs/sample-data/collections/speakers.json';
import type { Badge } from './badge';
import { allKeys } from './utils';

describe('badge', () => {
  it('matches the shape of the default data', () => {
    const badges: Badge[] = Object.values(speakers['speakers/dmytro_danylyk']['badges']);
    const keys: Array<keyof Badge> = ['description', 'link', 'name'];

    expect(badges).toHaveLength(2);
    expect(allKeys(badges)).toStrictEqual(keys);
  });
});
