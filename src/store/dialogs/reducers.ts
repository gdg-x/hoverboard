import {
  CLOSE_DIALOG,
  DialogActionTypes,
  OPEN_DIALOG,
  SET_DIALOG_DATA,
  SET_DIALOG_ERROR,
} from './types';
import { initialDialogState } from './state';

export const dialogsReducer = (state = initialDialogState, action: DialogActionTypes) => {
  switch (action.type) {
    case OPEN_DIALOG:
    case SET_DIALOG_DATA:
      return {
        ...state,
        ...action.dialog,
      };

    case SET_DIALOG_ERROR: {
      const dialog = state[action.payload.dialogName];

      return {
        ...state,
        ...{
          [action.payload.dialogName]: {
            isOpened: dialog.isOpened,
            data: { ...dialog.data, ...{ errorOccurred: true } },
          },
        },
      };
    }

    case CLOSE_DIALOG:
      return {
        ...state,
        ...{
          [action.dialogName]: initialDialogState[action.dialogName],
        },
      };
    default:
      return state;
  }
};
