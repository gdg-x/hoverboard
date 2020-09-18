import { initialTeamState } from './state';
import { FetchTeamActionTypes, FETCH_TEAM, FETCH_TEAM_FAILURE, FETCH_TEAM_SUCCESS } from './types';

export const teamReducer = (state = initialTeamState, action: FetchTeamActionTypes) => {
  switch (action.type) {
    case FETCH_TEAM:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
        },
      };

    case FETCH_TEAM_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_TEAM_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
        },
      };

    default:
      return state;
  }
};
