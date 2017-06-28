const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value || !state.isDrawerOpened
      });
    case SET_VIEWPORT_SIZE:
      return Object.assign({}, state, {
        viewport: Object.assign({}, state.viewport, action.value)
      });
    default:
      return state;
  }
};

const routeReducer = (state = initialState.route, action) => {
  switch (action.type) {
    case SET_ROUTE:
      return action.route;
    default:
      return state;
  }
};

const heroReducer = (state = initialState.hero, action) => {
  switch (action.type) {
    case SET_HERO:
      return action.hero;
    default:
      return state;
  }
};

const ticketsReducer = (state = initialState.tickets, action) => {
  switch (action.type) {
    case FETCH_TICKETS:
      return action.tickets;
    default:
      return state;
  }
};
