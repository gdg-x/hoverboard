import { initialUiState } from './state';
import {
  SET_HERO_SETTINGS,
  SET_VIEWPORT_SIZE,
  TOGGLE_VIDEO_DIALOG,
  UiActions,
  UiState,
} from './types';

export const uiReducer = (state = initialUiState, action: UiActions): UiState => {
  switch (action.type) {
    case TOGGLE_VIDEO_DIALOG:
      return {
        ...state,
        videoDialog: action.payload,
      };
    case SET_VIEWPORT_SIZE:
      return {
        ...state,
        viewport: {
          ...state.viewport,
          [action.payload.size]: action.payload.matches,
        },
      };
    case SET_HERO_SETTINGS:
      return {
        ...state,
        heroSettings: action.payload,
      };
    default:
      return state;
  }
};
