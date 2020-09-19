import data from '../../docs/default-firebase-data.json';
import { MemberData } from './member';
import { TeamData } from './team';
import { allKeys } from './utils';

type Team = TeamData & {
  members: MemberData[];
};

describe('partner', () => {
  it('matches the shape of the default data', () => {
    const teams: Team[] = Object.values(data['team']);
    const keys: Array<keyof Team> = ['members', 'title'];
    expect(teams).toHaveLength(2);
    expect(allKeys(teams)).toStrictEqual(keys);
  });
});
