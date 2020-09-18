import { Hero } from '../../models/hero';

export { Hero };

export const SET_VIEWPORT_SIZE = 'SET_VIEWPORT_SIZE';
export const SET_HERO_SETTINGS = 'SET_HERO_SETTINGS';
export const TOGGLE_VIDEO_DIALOG = 'TOGGLE_VIDEO_DIALOG';

export interface Viewport {
  isPhone: boolean;
  isTabletPlus: boolean;
  isLaptopPlus: boolean;
}

export interface VideoDialog {
  disableControls: boolean;
  opened: boolean;
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
  value: Viewport;
}

interface SetHeroSettingsAction {
  type: typeof SET_HERO_SETTINGS;
  value: Hero;
}

interface ToggleVideoDialogAction {
  type: typeof TOGGLE_VIDEO_DIALOG;
  value: VideoDialog;
}

export type UiActionTypes = SetViewPortSizeAction | SetHeroSettingsAction | ToggleVideoDialogAction;
