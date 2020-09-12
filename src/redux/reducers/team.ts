import { FETCH_TEAM, FETCH_TEAM_FAILURE, FETCH_TEAM_SUCCESS } from '../constants';
import { initialState } from '../initial-state';

export const teamReducer = (state = initialState.team, action) => {
  switch (action.type) {
    case FETCH_TEAM:
      return Object.assign({}, state, {
        fetching: true,
        fetchingError: null,
        list: [],
      });

    case FETCH_TEAM_FAILURE:
      return Object.assign({}, state, {
        fetching: false,
        fetchingError: action.payload.error,
      });

    case FETCH_TEAM_SUCCESS:
      return Object.assign({}, state, {
        fetching: false,
        list: action.payload.list,
      });

    default:
      return state;
  }
};
