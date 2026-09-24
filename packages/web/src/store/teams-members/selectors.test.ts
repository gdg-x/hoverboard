import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectTeamsAndMembers } from './selectors';
import { selectMembers } from '../members';
import { selectTeams } from '../teams';
import type { Member } from '../../models/member';
import type { Team, TeamWithoutMembers } from '../../models/team';
import type { RootState } from '..';

vi.mock('../members');
vi.mock('../teams');

describe('selectTeamsAndMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges members into the matching team', () => {
    const teams: TeamWithoutMembers[] = [
      { id: 'team-1', title: 'Core Team' } as TeamWithoutMembers,
      { id: 'team-2', title: 'Volunteers' } as TeamWithoutMembers,
    ];
    const members: Member[] = [
      { parentId: 'team-1', name: 'Ada' } as Member,
      { parentId: 'team-2', name: 'Grace' } as Member,
      { parentId: 'team-1', name: 'Linus' } as Member,
    ];

    vi.mocked(selectTeams).mockReturnValue(new Success(teams));
    vi.mocked(selectMembers).mockReturnValue(new Success(members));

    expect(selectTeamsAndMembers({} as RootState)).toStrictEqual(
      new Success<Team[]>([
        {
          id: 'team-1',
          title: 'Core Team',
          members: [members[0]!, members[2]!],
        },
        {
          id: 'team-2',
          title: 'Volunteers',
          members: [members[1]!],
        },
      ]),
    );
  });

  it('returns pending when either source is pending', () => {
    vi.mocked(selectTeams).mockReturnValue(new Pending());
    vi.mocked(selectMembers).mockReturnValue(new Success([]));

    expect(selectTeamsAndMembers({} as RootState)).toStrictEqual(new Pending());
  });

  it('returns the teams failure before checking members', () => {
    const error = new Error('teams failed');

    vi.mocked(selectTeams).mockReturnValue(new Failure(error));
    vi.mocked(selectMembers).mockReturnValue(new Failure(new Error('members failed')));

    expect(selectTeamsAndMembers({} as RootState)).toStrictEqual(new Failure(error));
  });

  it('returns the members failure when teams are otherwise initialized', () => {
    const error = new Error('members failed');

    vi.mocked(selectTeams).mockReturnValue(new Initialized());
    vi.mocked(selectMembers).mockReturnValue(new Failure(error));

    expect(selectTeamsAndMembers({} as RootState)).toStrictEqual(new Failure(error));
  });

  it('returns initialized when neither teams nor members has loaded yet', () => {
    vi.mocked(selectTeams).mockReturnValue(new Initialized());
    vi.mocked(selectMembers).mockReturnValue(new Initialized());

    expect(selectTeamsAndMembers({} as RootState)).toStrictEqual(new Initialized());
  });
});
