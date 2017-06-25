const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value || !state.isDrawerOpened
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
