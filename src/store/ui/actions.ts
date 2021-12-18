import { store } from '../';
import {
  Hero,
  SET_HERO_SETTINGS,
  SET_VIEWPORT_SIZE,
  TOGGLE_VIDEO_DIALOG,
  VideoDialog,
  Viewport,
} from './types';

export const setViewportSize = (payload: Viewport) => {
  store.dispatch({
    type: SET_VIEWPORT_SIZE,
    payload,
  });
};

export const toggleVideoDialog = (payload: VideoDialog) => {
  store.dispatch({
    type: TOGGLE_VIDEO_DIALOG,
    payload,
  });
};

export const setHeroSettings = (payload: Hero) => {
  store.dispatch({
    type: SET_HERO_SETTINGS,
    payload,
  });
};
