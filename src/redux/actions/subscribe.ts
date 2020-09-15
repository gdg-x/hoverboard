import { Dispatch } from 'redux';
import { SUBSCRIBE } from '../constants';
import { db } from '../db';
import { DIALOGS, SET_DIALOG_DATA } from '../dialogs/types';
import { store } from '../store';
import { helperActions } from './helper';
import { toastActions } from './toast';

interface User {
  email: string;
  firstFieldValue?: string;
  secondFieldValue?: string;
}

export const subscribeActions = {
  subscribe: (data: User) => (dispatch: Dispatch) => {
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
        toastActions.showToast({ message: '{$ subscribeBlock.toast $}' });
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
  },
  resetSubscribed: () => {
    store.dispatch({
      type: SUBSCRIBE,
      subscribed: false,
    });
  },
};
