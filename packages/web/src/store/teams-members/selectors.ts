import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { Member } from '../../models/member';
import type { Team, TeamWithoutMembers } from '../../models/team';
import { type MembersState, selectMembers } from '../members';
import { type TeamsState, selectTeams } from '../teams';
import type { TeamsMembersState } from './state';

const mergeMembers = (team: TeamWithoutMembers, possibleMembers: Member[]): Team => {
  return {
    ...team,
    members: possibleMembers.filter((member) => member.parentId === team.id),
  };
};

export const selectTeamsAndMembers = createSelector(
  selectTeams,
  selectMembers,
  (teams: TeamsState, members: MembersState): TeamsMembersState => {
    if (teams instanceof Success && members instanceof Success) {
      const merged = teams.data.map((team) => mergeMembers(team, members.data));
      return new Success(merged);
    } else if (teams instanceof Pending || members instanceof Pending) {
      return new Pending();
    } else if (teams instanceof Failure) {
      return new Failure(teams.error);
    } else if (members instanceof Failure) {
      return new Failure(members.error);
    } else {
      return new Initialized();
    }
  },
);
