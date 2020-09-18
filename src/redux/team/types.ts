import { FirebaseError } from 'firebase';
import { Team } from '../../models/team';

export const FETCH_TEAM = 'FETCH_TEAM';
export const FETCH_TEAM_FAILURE = 'FETCH_TEAM_FAILURE';
export const FETCH_TEAM_SUCCESS = 'FETCH_TEAM_SUCCESS';

export interface TeamState {
  fetching: boolean;
  fetchingError?: FirebaseError;
  list: Team[];
}

interface FetchTeamAction {
  type: typeof FETCH_TEAM;
}

interface FetchTeamFailureAction {
  type: typeof FETCH_TEAM_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchTeamSuccessAction {
  type: typeof FETCH_TEAM_SUCCESS;
  payload: {
    list: Team[];
  };
}

export type FetchTeamActionTypes =
  | FetchTeamAction
  | FetchTeamFailureAction
  | FetchTeamSuccessAction;
