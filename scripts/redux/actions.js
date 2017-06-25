const uiActions = {
  toggleDrawer: (value = null) => {
    store.dispatch({
      type: TOGGLE_DRAWER,
      value
    });
  }
};

const routeActions = {
  setRoute: routeFromAction => {
    const route = routeFromAction || 'home';
    store.dispatch({
      type: SET_ROUTE,
      route
    });
    store.dispatch({
      type: SET_HERO,
      hero: heroSettings[route]
    });
  }
};
