import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialTeamState, TeamState } from './state';
import { FETCH_TEAM, FETCH_TEAM_FAILURE, FETCH_TEAM_SUCCESS, TeamActions } from './types';

export const teamReducer = (state = initialTeamState, action: TeamActions): TeamState => {
  switch (action.type) {
    case FETCH_TEAM:
      return new Pending();

    case FETCH_TEAM_FAILURE:
      return new Failure(action.payload);

    case FETCH_TEAM_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
