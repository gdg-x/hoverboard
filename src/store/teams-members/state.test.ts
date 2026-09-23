import { Initialized } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { initialTeamsMembersState } from './state';

describe('teams-members state', () => {
  it('starts initialized', () => {
    expect(initialTeamsMembersState).toBeInstanceOf(Initialized);
    expect(initialTeamsMembersState).toStrictEqual(new Initialized());
  });
});
