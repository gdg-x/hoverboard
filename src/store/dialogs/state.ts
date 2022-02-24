import { Initialized, RemoteData } from '@abraham/remotedata';
import { DialogForm } from '../../models/dialog-form';
import { Session } from '../../models/session';
import { DIALOG } from './types';

export interface SigninDialog {
  name: DIALOG.SIGNIN;
}
export interface SubscribeDialog {
  name: DIALOG.SUBSCRIBE;
  data: DialogForm;
}
export interface FeedbackDialog {
  name: DIALOG.FEEDBACK;
  data: Session;
}

export type Dialog = SigninDialog | SubscribeDialog | FeedbackDialog;

export type DialogState = RemoteData<Error, Dialog>;
export const initialDialogState: DialogState = new Initialized();
