import { Initialized, RemoteData } from '@abraham/remotedata';
import { DIALOG } from './types';

export interface Dialog {
  name: DIALOG;
  data: unknown; // TODO: type
}

export type DialogState = RemoteData<Error, Dialog>;
export const initialDialogState: DialogState = new Initialized();
