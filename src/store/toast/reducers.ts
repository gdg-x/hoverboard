import { initialToastState } from './state';
import { HIDE_TOAST, SHOW_TOAST, ToastActionTypes } from './types';

export const toastReducer = (state = initialToastState, action: ToastActionTypes) => {
  switch (action.type) {
    case SHOW_TOAST:
      return action.toast;
    case HIDE_TOAST:
      return initialToastState;
    default:
      return state;
  }
};
