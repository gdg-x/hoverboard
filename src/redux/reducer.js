const uiReducer = (state, action) => {
  if (!state) return initialState.ui;

  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value !== null ? action.value : !state.ui.isDrawerOpened
      });
  }
};
