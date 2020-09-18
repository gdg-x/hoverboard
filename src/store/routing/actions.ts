import { SET_ROUTE, SET_SUB_ROUTE } from './types';
import { store } from '../';

export const setRoute = (routeFromAction: string) => {
  const route = routeFromAction || 'home';
  store.dispatch({
    type: SET_ROUTE,
    route,
  });
};

export const setSubRoute = (subRoute: string) => {
  store.dispatch({
    type: SET_SUB_ROUTE,
    subRoute,
  });
};

export const setLocation = (url: string) => {
  window.history.pushState({}, '', url);
  Polymer.Base.fire('location-changed', {}, { node: window });
};
