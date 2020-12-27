import { initialRoutingState, RoutingState } from './state';
import { RouteActions, SET_ROUTE, SET_SUB_ROUTE } from './types';

export const routingReducer = (state = initialRoutingState, action: RouteActions): RoutingState => {
  switch (action.type) {
    case SET_ROUTE:
      return {
        route: action.payload,
      };

    case SET_SUB_ROUTE:
      return {
        route: state.route,
        subRoute: action.payload,
      };

    default:
      return state;
  }
};
