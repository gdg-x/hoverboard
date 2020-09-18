export const OPEN_DIALOG = 'OPEN_DIALOG';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const SET_DIALOG_DATA = 'SET_DIALOG_DATA';
export const SET_DIALOG_ERROR = 'SET_DIALOG_ERROR';

export interface DialogForm {
  email: string;
  firstFieldValue?: string;
  secondFieldValue?: string;
}

export enum DIALOGS {
  SPEAKER = 'speaker',
  PREVIOUS_SPEAKER = 'previousSpeaker',
  SESSION = 'session',
  FEEDBACK = 'feedback',
  SUBSCRIBE = 'subscribe',
  SIGNIN = 'signin',
}

interface Dialog {
  isOpened: boolean;
  data: {};
}

export interface DialogState {
  [DIALOGS.SPEAKER]: Dialog;
  [DIALOGS.PREVIOUS_SPEAKER]: Dialog;
  [DIALOGS.SESSION]: Dialog;
  [DIALOGS.FEEDBACK]: Dialog;
  [DIALOGS.SUBSCRIBE]: Dialog;
  [DIALOGS.SIGNIN]: Dialog;
}

interface OpenDialogAction {
  type: typeof OPEN_DIALOG;
  dialog: {
    [key: string]: Dialog;
  };
}

interface SetDialogDataAction {
  type: typeof SET_DIALOG_DATA;
  dialog: {
    [key: string]: Dialog;
  };
}

interface CloseDialogAction {
  type: typeof CLOSE_DIALOG;
  dialogName: DIALOGS;
}

interface SetDialogErrorAction {
  type: typeof SET_DIALOG_ERROR;
  payload: {
    dialogName: DIALOGS;
  };
}

export type DialogActionTypes =
  | OpenDialogAction
  | SetDialogDataAction
  | CloseDialogAction
  | SetDialogErrorAction;
