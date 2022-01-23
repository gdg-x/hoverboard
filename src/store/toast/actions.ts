import { HIDE_TOAST, SHOW_TOAST } from './types';
import { store } from '../';
import { DURATION, Toast } from '../../models/toast';

let toastHideTimeOut: number;

export const showSimpleToast = (message: string) =>
  showToast({ message, duration: DURATION.DEFAULT });
export const showForeverToast = (message: string) =>
  showToast({ message, duration: DURATION.FOREVER });

export const showToast = (toast: Toast) => {
  const duration = toast.duration ?? DURATION.DEFAULT;
  store.dispatch({
    type: SHOW_TOAST,
    payload: {
      ...toast,
      duration,
      visible: true,
    },
  });

  if (duration === DURATION.FOREVER) return;

  window.clearTimeout(toastHideTimeOut);
  toastHideTimeOut = window.setTimeout(() => hideToast(), duration);
};

export const hideToast = () => {
  window.clearTimeout(toastHideTimeOut);
  store.dispatch({
    type: HIDE_TOAST,
  });
};
