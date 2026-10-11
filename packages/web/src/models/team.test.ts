import { describe, expect, it } from 'vitest';
import team from '../../../../docs/sample-data/collections/team.json';
import type { TeamData } from './team';
import { allKeys } from './utils';

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const teams: TeamData[] = Object.values(team);
    const keys: Array<keyof TeamData> = ['title'];

    expect(teams).toHaveLength(2);
    expect(allKeys(teams)).toStrictEqual(keys);
  });
});
