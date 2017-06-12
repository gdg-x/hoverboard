const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value !== null ? action.value : !state.ui.isDrawerOpened
      });
    default:
      return state;
  }
};

const routeReducer = (state = initialState.route, action) => {
  switch (action.type) {
    case SET_ROUTE:
      return action.route || 'home';
    default:
      return state;
  }
};


const heroReducer = (state = initialState.hero, action) => {
  switch (action.type) {
    case SET_HERO:
      const { hero } = action;
      return Object.assign({}, state, hero);
    default:
      return state;
  }
};
