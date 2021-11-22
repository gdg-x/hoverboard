import { HIDE_TOAST, SHOW_TOAST } from './types';
import { store } from '../';
import { Toast } from '../../models/toast';

let toastHideTimeOut: number;

export const showToast = (toast: Toast) => {
  const duration = toast.duration || 5000;
  store.dispatch({
    type: SHOW_TOAST,
    payload: {
      ...toast,
      duration,
      visible: true,
    },
  });

  if (duration === 0) return;

  window.clearTimeout(toastHideTimeOut);
  toastHideTimeOut = window.setTimeout(() => hideToast(), duration);
};

export const hideToast = () => {
  window.clearTimeout(toastHideTimeOut);
  store.dispatch({
    type: HIDE_TOAST,
  });
};
