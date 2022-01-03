import { store } from '../';
import { CLOSE_DIALOG, DIALOG, OPEN_DIALOG, SET_DIALOG_ERROR } from './types';

export const closeDialog = () => {
  store.dispatch({
    type: CLOSE_DIALOG,
  });
};

export const setDialogError = (error: Error) => {
  store.dispatch({
    type: SET_DIALOG_ERROR,
    payload: error,
  });
};

// TODO: type
export const openDialog = (name: DIALOG, data?: unknown) => {
  store.dispatch({
    type: OPEN_DIALOG,
    payload: {
      name,
      data,
    },
  });
};
