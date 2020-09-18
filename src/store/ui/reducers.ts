import { initialUiState } from './state';
import { SET_HERO_SETTINGS, SET_VIEWPORT_SIZE, TOGGLE_VIDEO_DIALOG, UiActionTypes } from './types';

export const uiReducer = (state = initialUiState, action: UiActionTypes) => {
  switch (action.type) {
    case TOGGLE_VIDEO_DIALOG:
      return {
        ...state,
        ...{ videoDialog: action.value },
      };
    case SET_VIEWPORT_SIZE:
      return {
        ...state,
        ...{ viewport: action.value },
      };
    case SET_HERO_SETTINGS:
      return {
        ...state,
        ...{ heroSettings: action.value },
      };
    default:
      return state;
  }
};
