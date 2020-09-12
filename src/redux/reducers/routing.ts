import { SET_ROUTE, SET_SUB_ROUTE } from '../constants';
import { initialState } from '../initial-state';

export const routingReducer = (state = initialState.routing, action) => {
  switch (action.type) {
    case SET_ROUTE:
      return Object.assign({}, state, {
        route: action.route,
        subRoute: null,
      });
    case SET_SUB_ROUTE:
      return Object.assign({}, state, {
        subRoute: action.subRoute,
      });
    default:
      return state;
  }
};
