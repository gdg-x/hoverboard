import { Initialized, RemoteData } from '@abraham/remotedata';
import { DIALOGS } from './types';

export interface Dialog {
  name: DIALOGS;
  data: unknown; // TODO: type
}

export type DialogState = RemoteData<Error, Dialog>;
export const initialDialogState: DialogState = new Initialized();
