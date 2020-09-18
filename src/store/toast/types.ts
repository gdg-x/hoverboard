import { Toast } from '../../models/toast';

export const SHOW_TOAST = 'SHOW_TOAST';
export const HIDE_TOAST = 'HIDE_TOAST';

export type ToastState = Toast;

interface ShowToastAction {
  type: typeof SHOW_TOAST;
  toast: Toast;
}

interface HideToastAction {
  type: typeof HIDE_TOAST;
}

export type ToastActionTypes = ShowToastAction | HideToastAction;
