import { store } from '../';
import {
  Hero,
  SET_HERO_SETTINGS,
  SET_VIEWPORT_SIZE,
  TOGGLE_VIDEO_DIALOG,
  VideoDialog,
  Viewport,
} from './types';

export const setViewportSize = (value: Viewport) => {
  store.dispatch({
    type: SET_VIEWPORT_SIZE,
    value,
  });
};

export const toggleVideoDialog = (value: VideoDialog) => {
  store.dispatch({
    type: TOGGLE_VIDEO_DIALOG,
    value,
  });
};

export const setHeroSettings = (value: Hero) => {
  store.dispatch({
    type: SET_HERO_SETTINGS,
    value,
  });
};
