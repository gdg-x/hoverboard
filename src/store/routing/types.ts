export const SET_ROUTE = 'SET_ROUTE';
export const SET_SUB_ROUTE = 'SET_SUB_ROUTE';

interface SetRouteAction {
  type: typeof SET_ROUTE;
  payload: string;
}

interface SetSubRouteAction {
  type: typeof SET_SUB_ROUTE;
  payload: string;
}

export type RouteActions = SetRouteAction | SetSubRouteAction;
