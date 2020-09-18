import { DIALOGS, DialogState } from './types';

export const initialDialogState: DialogState = {
  [DIALOGS.SPEAKER]: {
    isOpened: false,
    data: {},
  },
  [DIALOGS.PREVIOUS_SPEAKER]: {
    isOpened: false,
    data: {},
  },
  [DIALOGS.SESSION]: {
    isOpened: false,
    data: {},
  },
  [DIALOGS.FEEDBACK]: {
    isOpened: false,
    data: {},
  },
  [DIALOGS.SUBSCRIBE]: {
    isOpened: false,
    data: {},
  },
  [DIALOGS.SIGNIN]: {
    isOpened: false,
    data: {},
  },
};
