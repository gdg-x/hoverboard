export const SET_ROUTE = 'SET_ROUTE';
export const SET_SUB_ROUTE = 'SET_SUB_ROUTE';

export interface RoutingState {
  route: string;
  subRoute: string;
}

interface SetRoute {
  type: typeof SET_ROUTE;
  route: string;
}

interface SetSubRoute {
  type: typeof SET_SUB_ROUTE;
  subRoute: string;
}

export type RouteActionTypes = SetRoute | SetSubRoute;
