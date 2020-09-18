import { CLOSE_DIALOG, DIALOGS, OPEN_DIALOG, SET_DIALOG_ERROR } from './types';
import { store } from '../';

export const closeDialog = (dialogName: DIALOGS) => {
  store.dispatch({
    type: CLOSE_DIALOG,
    dialogName,
  });
};

export const setDialogError = (dialogName: DIALOGS) => {
  store.dispatch({
    type: SET_DIALOG_ERROR,
    payload: { dialogName },
  });
};

export const openDialog = (dialogName: DIALOGS, data?: unknown) => {
  store.dispatch({
    type: OPEN_DIALOG,
    dialog: {
      [dialogName]: {
        isOpened: true,
        data,
      },
    },
  });
};

export const dialogsActions = {
  openDialog: (dialogName: DIALOGS, data?: unknown) => {
    store.dispatch({
      type: OPEN_DIALOG,
      dialog: {
        [dialogName]: {
          isOpened: true,
          data,
        },
      },
    });
  },
  closeDialog: (dialogName: DIALOGS) => {
    store.dispatch({
      type: CLOSE_DIALOG,
      dialogName,
    });
  },
  setDialogError: (dialogName: DIALOGS) => ({
    type: SET_DIALOG_ERROR,
    payload: { dialogName },
  }),
};
