import { store } from '../';
import { FeedbackDialog, SubscribeDialog } from './state';
import { CLOSE_DIALOG, DIALOG, OPEN_DIALOG } from './types';

export const closeDialog = () => {
  store.dispatch({
    type: CLOSE_DIALOG,
  });
};

export const openSigninDialog = () => {
  store.dispatch({
    type: OPEN_DIALOG,
    payload: { name: DIALOG.SIGNIN },
  });
};

export const openSubscribeDialog = (data: SubscribeDialog['data']) => {
  store.dispatch({
    type: OPEN_DIALOG,
    payload: { name: DIALOG.SUBSCRIBE, data },
  });
};

export const openFeedbackDialog = (data: FeedbackDialog['data']) => {
  store.dispatch({
    type: OPEN_DIALOG,
    payload: { name: DIALOG.FEEDBACK, data },
  });
};
