import { Hero } from '../../models/hero';
import { SET_HERO_SETTINGS, SET_VIEWPORT_SIZE, TOGGLE_VIDEO_DIALOG } from '../constants';
import { store } from '../store';

export interface VideoDialog {
  title: string;
  youtubeId: string;
  disableControls: boolean;
  opened: boolean;
}

export const uiActions = {
  setViewportSize: (value) => {
    store.dispatch({
      type: SET_VIEWPORT_SIZE,
      value,
    });
  },
  toggleVideoDialog: (value: VideoDialog) => {
    store.dispatch({
      type: TOGGLE_VIDEO_DIALOG,
      value,
    });
  },
  setHeroSettings: (value: Hero) => {
    store.dispatch({
      type: SET_HERO_SETTINGS,
      value,
    });
  },
};
