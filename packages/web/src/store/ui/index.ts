import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { dispatch } from '../dispatch';

/** Where the visitor's choice to see schedule times in their own time zone is stored. */
export const LOCAL_TIME_KEY = 'hb-local-time';

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
  /** Show schedule times in the visitor's time zone instead of the event's. */
  localTime: boolean;
  videoDialog: VideoDialog;
  viewport: Viewport;
}

export const initialUiState: UiState = {
  localTime: false,
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
    setLocalTime: (state, action: PayloadAction<boolean>): void => {
      state.localTime = action.payload;
    },
    toggleVideoDialog: (state, action: PayloadAction<VideoDialog>): void => {
      state.videoDialog = action.payload;
    },
  },
});

const {
  setViewportSize: setViewportSizeAction,
  setLocalTime: setLocalTimeAction,
  toggleVideoDialog,
} = slice.actions;

export const setViewportSize = (payload: SetViewport) => {
  dispatch(setViewportSizeAction(payload));
};

/** Shows schedule times in the visitor's time zone or the event's, and remembers the choice. */
export const setLocalTime = (localTime: boolean) => {
  dispatch(setLocalTimeAction(localTime));
  try {
    if (localTime) localStorage.setItem(LOCAL_TIME_KEY, 'true');
    else localStorage.removeItem(LOCAL_TIME_KEY);
  } catch {
    // Storage can throw in private modes. The choice then lasts until the page reloads.
  }
};

/** Applies the stored choice. Call it after the first render, which must match the server's. */
export const loadLocalTime = () => {
  try {
    if (localStorage.getItem(LOCAL_TIME_KEY) === 'true') dispatch(setLocalTimeAction(true));
  } catch {
    // Storage can throw in private modes.
  }
};

export const selectLocalTime = (state: RootState) => state.ui.localTime;

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
