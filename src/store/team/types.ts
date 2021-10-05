import { Team } from '../../models/team';

export const FETCH_TEAM = 'FETCH_TEAM';
export const FETCH_TEAM_FAILURE = 'FETCH_TEAM_FAILURE';
export const FETCH_TEAM_SUCCESS = 'FETCH_TEAM_SUCCESS';

interface FetchTeamAction {
  type: typeof FETCH_TEAM;
}

interface FetchTeamFailureAction {
  type: typeof FETCH_TEAM_FAILURE;
  payload: Error;
}

interface FetchTeamSuccessAction {
  type: typeof FETCH_TEAM_SUCCESS;
  payload: Team[];
}

export type TeamActions = FetchTeamAction | FetchTeamFailureAction | FetchTeamSuccessAction;
