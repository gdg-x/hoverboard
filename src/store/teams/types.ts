import { TeamWithoutMembers } from '../../models/team';

export const FETCH_TEAMS = 'FETCH_TEAMS';
export const FETCH_TEAMS_FAILURE = 'FETCH_TEAMS_FAILURE';
export const FETCH_TEAMS_SUCCESS = 'FETCH_TEAMS_SUCCESS';

interface FetchTeamsAction {
  type: typeof FETCH_TEAMS;
}

interface FetchTeamsFailureAction {
  type: typeof FETCH_TEAMS_FAILURE;
  payload: Error;
}

interface FetchTeamsSuccessAction {
  type: typeof FETCH_TEAMS_SUCCESS;
  payload: TeamWithoutMembers[];
}

export type TeamsActions = FetchTeamsAction | FetchTeamsFailureAction | FetchTeamsSuccessAction;
