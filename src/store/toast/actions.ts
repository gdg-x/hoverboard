import { HIDE_TOAST, SHOW_TOAST } from './types';
import { store } from '../';
import { Toast } from '../../models/toast';

let toastHideTimeOut: number;

export const showToast = (toast: Toast) => {
  const duration = typeof toast.duration !== 'undefined' ? toast.duration : 5000;
  store.dispatch({
    type: SHOW_TOAST,
    toast: {
      ...toast,
      ...{
        duration,
        visible: true,
      },
    },
  });

  if (duration === 0) return;

  clearTimeout(toastHideTimeOut);
  toastHideTimeOut = window.setTimeout(() => hideToast(), duration);
};

export const hideToast = () => {
  clearTimeout(toastHideTimeOut);
  store.dispatch({
    type: HIDE_TOAST,
  });
};
