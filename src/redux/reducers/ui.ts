import { SET_HERO_SETTINGS, SET_VIEWPORT_SIZE, TOGGLE_VIDEO_DIALOG } from '../constants';
import { initialState } from '../initial-state';

export const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_VIDEO_DIALOG:
      return Object.assign({}, state, {
        videoDialog: Object.assign({}, state.videoDialog, action.value),
      });
    case SET_VIEWPORT_SIZE:
      return Object.assign({}, state, {
        viewport: Object.assign({}, state.viewport, action.value),
      });
    case SET_HERO_SETTINGS:
      return Object.assign({}, state, {
        heroSettings: Object.assign({}, state.heroSettings, action.value),
      });
    default:
      return state;
  }
};
