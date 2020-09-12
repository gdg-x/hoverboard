import { SET_DIALOG_DATA, SUBSCRIBE } from '../constants';
import { db } from '../db';
import { store } from '../store';
import { helperActions } from './helper';
import { toastActions } from './toast';

export const subscribeActions = {
  subscribe: (data) => (dispatch) => {
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
            ['subscribe']: {
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
