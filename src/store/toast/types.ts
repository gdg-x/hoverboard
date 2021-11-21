import { Toast } from '../../models/toast';

export const SHOW_TOAST = 'SHOW_TOAST';
export const HIDE_TOAST = 'HIDE_TOAST';

interface ShowToastAction {
  type: typeof SHOW_TOAST;
  payload: Toast;
}

interface HideToastAction {
  type: typeof HIDE_TOAST;
}

export type ToastActions = ShowToastAction | HideToastAction;
