import { doc, setDoc } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { store } from '../';
import { db } from '../../firebase';
import { openDialog } from '../dialogs/actions';
import { DialogForm, DIALOG } from '../dialogs/types';
import { showToast } from '../toast/actions';
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
    showToast({ message: '{$ subscribeBlock.toast $}' });
  } catch (error) {
    dispatch({
      type: SUBSCRIBE_FAILURE,
      payload: error,
    });
    openDialog(DIALOG.SUBSCRIBE, { ...data, errorOccurred: true });
  }
};

export const resetSubscribed = () => {
  store.dispatch({
    type: SUBSCRIBE_RESET,
  });
};
