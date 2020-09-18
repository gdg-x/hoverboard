import { UiState } from './types';

export const initialUiState: UiState = {
  heroSettings: undefined,
  videoDialog: {
    opened: false,
    disableControls: false,
    youtubeId: '',
    title: '',
  },
  viewport: {
    isPhone: true,
    isTabletPlus: false,
    isLaptopPlus: false,
  },
};
