import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Hero } from '../../models/hero';
import { heroSettings } from '../../utils/data';
import { dispatch } from '../dispatch';

export type { Hero };

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

export const initialUiState: UiState = {
  heroSettings: {
    backgroundColor: heroSettings.home.background.color,
    backgroundImage: heroSettings.home.background.image,
    fontColor: heroSettings.home.fontColor,
    hideLogo: false,
  },
  videoDialog: {
    open: false,
    youtubeId: '',
    title: '',
  },
  viewport: {
    isPhone: true,
    isTabletPlus: false,
    isLaptopPlus: false,
  },
};

const slice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    setViewportSize: (state, action: PayloadAction<SetViewport>): void => {
      state.viewport[action.payload.size] = action.payload.matches;
    },
    setHeroSettings: (state, action: PayloadAction<Hero>): void => {
      state.heroSettings = action.payload;
    },
    toggleVideoDialog: (state, action: PayloadAction<VideoDialog>): void => {
      state.videoDialog = action.payload;
    },
  },
});

const {
  setViewportSize: setViewportSizeAction,
  setHeroSettings: setHeroSettingsAction,
  toggleVideoDialog,
} = slice.actions;

export const setViewportSize = (payload: SetViewport) => {
  dispatch(setViewportSizeAction(payload));
};

export const setHeroSettings = (payload: Hero) => {
  dispatch(setHeroSettingsAction(payload));
};

export const closeVideoDialog = () => {
  dispatch(
    toggleVideoDialog({
      open: false,
      youtubeId: '',
      title: '',
    }),
  );
};

export const openVideoDialog = (payload: Omit<VideoDialog, 'open'>) => {
  dispatch(toggleVideoDialog({ ...payload, open: true }));
};

export const selectViewport = (state: RootState) => state.ui.viewport;

export default slice.reducer;
