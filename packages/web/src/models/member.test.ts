import { describe, expect, it } from 'vitest';
import teamMembers from '../../../../docs/sample-data/collections/team--members.json';
import type { MemberData } from './member';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const members: MemberData[] = Object.entries(teamMembers)
      .filter(([path]) => path.startsWith('team/0/'))
      .map(([, member]) => member);
    const keys: Array<keyof MemberData> = [
      'name',
      'order',
      'photo',
      'photoUrl',
      'socials',
      'title',
    ];

    expect(members).toHaveLength(8);
    expect(allKeys(members)).toStrictEqual(keys);
  });
});
