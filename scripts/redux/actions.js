const uiActions = {
  toggleDrawer: (value = null) => {
    store.dispatch({
      type: TOGGLE_DRAWER,
      value
    });
  }
};

const routeActions = {
  setRoute: route => {
    store.dispatch({
      type: SET_ROUTE,
      route
    });
  }
};
