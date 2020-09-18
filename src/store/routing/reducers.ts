import { initialRoutingState } from './state';
import { RouteActionTypes, SET_ROUTE, SET_SUB_ROUTE } from './types';

export const routingReducer = (state = initialRoutingState, action: RouteActionTypes) => {
  switch (action.type) {
    case SET_ROUTE:
      return {
        ...state,
        ...{
          route: action.route,
          subRoute: null,
        },
      };
    case SET_SUB_ROUTE:
      return {
        ...state,
        ...{
          subRoute: action.subRoute,
        },
      };
    default:
      return state;
  }
};
