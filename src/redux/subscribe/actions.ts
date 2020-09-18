import { Dispatch } from 'redux';
import { SUBSCRIBE } from './types';
import { db } from '../db';
import { DialogForm, DIALOGS, SET_DIALOG_DATA } from '../dialogs/types';
import { store } from '../store';
import { showToast } from '../toast/actions';
import { helperActions } from '../actions/helper';

export const subscribe = (data: DialogForm) => (dispatch: Dispatch) => {
  const id = data.email.replace(/[^\w\s]/gi, '');

  db()
    .collection('subscribers')
    .doc(id)
    .set({
      email: data.email,
      firstName: data.firstFieldValue || '',
      lastName: data.secondFieldValue || '',
    })
    .then(() => {
      dispatch({
        type: SUBSCRIBE,
        subscribed: true,
      });
      showToast({ message: '{$ subscribeBlock.toast $}' });
    })
    .catch((error) => {
      dispatch({
        type: SET_DIALOG_DATA,
        dialog: {
          [DIALOGS.SUBSCRIBE]: {
            isOpened: true,
            data: Object.assign(data, { errorOccurred: true }),
          },
        },
      });

      dispatch({
        type: SUBSCRIBE,
        subscribed: false,
      });

      helperActions.trackError('subscribeActions', 'subscribe', error);
    });
};

export const resetSubscribed = () => {
  store.dispatch({
    type: SUBSCRIBE,
    subscribed: false,
  });
};
