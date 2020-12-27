import { Failure, Initialized, Success } from '@abraham/remotedata';
import { DialogState, initialDialogState } from './state';
import { CLOSE_DIALOG, DialogActions, OPEN_DIALOG, SET_DIALOG_ERROR } from './types';

export const dialogsReducer = (state = initialDialogState, action: DialogActions): DialogState => {
  switch (action.type) {
    case OPEN_DIALOG:
      return new Success(action.payload);

    case SET_DIALOG_ERROR:
      return new Failure(action.payload);

    case CLOSE_DIALOG:
      return new Initialized();

    default:
      return state;
  }
};
