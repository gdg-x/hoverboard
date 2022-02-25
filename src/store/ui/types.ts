import { Hero } from '../../models/hero';

export type { Hero };

export const VIEWPORT_SIZE = 'VIEWPORT_SIZE';
export const SET_VIEWPORT_SIZE = 'SET_VIEWPORT_SIZE';
export const SET_HERO_SETTINGS = 'SET_HERO_SETTINGS';
export const TOGGLE_VIDEO_DIALOG = 'TOGGLE_VIDEO_DIALOG';

export enum VIEWPORT {
  isPhone = 'isPhone',
  isTabletPlus = 'isTabletPlus',
  isLaptopPlus = 'isLaptopPlus',
}

export type Viewport = {
  [index in VIEWPORT]: boolean;
};

export interface SetViewport {
  size: VIEWPORT;
  matches: boolean;
}

export interface VideoDialog {
  open: boolean;
  title: string;
  youtubeId: string;
}

export interface UiState {
  heroSettings?: Hero;
  videoDialog: VideoDialog;
  viewport: Viewport;
}

interface SetViewPortSizeAction {
  type: typeof SET_VIEWPORT_SIZE;
  payload: SetViewport;
}
interface ViewPortSizeAction {
  type: typeof VIEWPORT_SIZE;
}

interface SetHeroSettingsAction {
  type: typeof SET_HERO_SETTINGS;
  payload: Hero;
}

interface ToggleVideoDialogAction {
  type: typeof TOGGLE_VIDEO_DIALOG;
  payload: VideoDialog;
}

export type UiActions =
  | ViewPortSizeAction
  | SetViewPortSizeAction
  | SetHeroSettingsAction
  | ToggleVideoDialogAction;
