import { CLOSE_DIALOG, OPEN_DIALOG, SET_DIALOG_DATA, SET_DIALOG_ERROR } from '../constants';
import { initialState } from '../initial-state';

export const dialogsReducer = (state = initialState.dialogs, action) => {
  switch (action.type) {
    case OPEN_DIALOG:
    case SET_DIALOG_DATA:
      return Object.assign({}, state, action.dialog);

    case SET_DIALOG_ERROR: {
      const dialog = state[action.payload.dialogName];

      return Object.assign({}, state, {
        [action.payload.dialogName]: {
          isOpened: dialog.isOpened,
          data: Object.assign({}, dialog.data, { errorOccurred: true }),
        },
      });
    }

    case CLOSE_DIALOG:
      return Object.assign({}, state, {
        [action.dialogName]: initialState.dialogs[action.dialogName],
      });
    default:
      return state;
  }
};
