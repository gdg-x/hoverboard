import { HIDE_TOAST, SHOW_TOAST } from '../constants';
import { initialState } from '../initial-state';

export const toastReducer = (state = initialState.toast, action) => {
  switch (action.type) {
    case SHOW_TOAST:
      return action.toast;
    case HIDE_TOAST:
      return initialState.toast;
    default:
      return state;
  }
};
