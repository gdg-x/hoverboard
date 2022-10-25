import { Failure, Pending, Success } from '@abraham/remotedata';
import { initialTeamsState, TeamsState } from './state';
import { FETCH_TEAMS, FETCH_TEAMS_FAILURE, FETCH_TEAMS_SUCCESS, TeamsActions } from './types';

export const teamsReducer = (state = initialTeamsState, action: TeamsActions): TeamsState => {
  switch (action.type) {
    case FETCH_TEAMS:
      return new Pending();

    case FETCH_TEAMS_FAILURE:
      return new Failure(action.payload);

    case FETCH_TEAMS_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
