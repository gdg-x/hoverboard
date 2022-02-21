import { doc, setDoc } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { store } from '../';
import { db } from '../../firebase';
import { subscribeBlock } from '../../utils/data';
import { openDialog } from '../dialogs/actions';
import { DIALOG, DialogForm } from '../dialogs/types';
import { queueSnackbar } from '../snackbars';
import { subscribeBlock } from '../../../data/resources.json';
import {
  SUBSCRIBE,
  SubscribeActions,
  SUBSCRIBE_FAILURE,
  SUBSCRIBE_RESET,
  SUBSCRIBE_SUCCESS,
} from './types';

const setSubscribe = async (data: DialogForm): Promise<true> => {
  const id = data.email.replace(/[^\w\s]/gi, '');
  const subscriber = {
    email: data.email,
    firstName: data.firstFieldValue || '',
    lastName: data.secondFieldValue || '',
  };

  await setDoc(doc(db, 'subscribers', id), subscriber);

  return true;
};

export const subscribe = (data: DialogForm) => async (dispatch: Dispatch<SubscribeActions>) => {
  dispatch({
    type: SUBSCRIBE,
  });

  try {
    dispatch({
      type: SUBSCRIBE_SUCCESS,
      payload: await setSubscribe(data),
    });
    store.dispatch(queueSnackbar(subscribeBlock.toast));
  } catch (error) {
    dispatch({
      type: SUBSCRIBE_FAILURE,
      payload: error as Error,
    });
    openDialog(DIALOG.SUBSCRIBE, { ...data, errorOccurred: true });
  }
};

export const resetSubscribed = () => {
  store.dispatch({
    type: SUBSCRIBE_RESET,
  });
};
