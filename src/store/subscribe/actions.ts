import { Dispatch } from 'redux';
import { store } from '../';
import { db } from '../db';
import { openDialog } from '../dialogs/actions';
import { DialogForm, DIALOGS } from '../dialogs/types';
import { showToast } from '../toast/actions';
import { SUBSCRIBE } from './types';

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
      openDialog(DIALOGS.SUBSCRIBE, { ...data, errorOccurred: true });

      dispatch({
        type: SUBSCRIBE,
        subscribed: false,
      });
    });
};

export const resetSubscribed = () => {
  store.dispatch({
    type: SUBSCRIBE,
    subscribed: false,
  });
};
