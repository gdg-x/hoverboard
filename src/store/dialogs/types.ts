import { Dialog } from './state';

export const OPEN_DIALOG = 'OPEN_DIALOG';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const SET_DIALOG_ERROR = 'SET_DIALOG_ERROR';

export interface DialogForm {
  email: string;
  firstFieldValue?: string;
  secondFieldValue?: string;
}

export enum DIALOG {
  SPEAKER = 'speaker',
  PREVIOUS_SPEAKER = 'previousSpeaker',
  SESSION = 'session',
  FEEDBACK = 'feedback',
  SUBSCRIBE = 'subscribe',
  SIGNIN = 'signin',
}

interface OpenDialogAction {
  type: typeof OPEN_DIALOG;
  payload: Dialog;
}

interface CloseDialogAction {
  type: typeof CLOSE_DIALOG;
}

interface SetDialogErrorAction {
  type: typeof SET_DIALOG_ERROR;
  payload: Error;
}

export type DialogActions = OpenDialogAction | CloseDialogAction | SetDialogErrorAction;
