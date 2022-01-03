import { Success } from '@abraham/remotedata';
import { DialogState } from '../store/dialogs/state';
import { DIALOG } from '../store/dialogs/types';

export const isDialogOpen = (dialog: DialogState, name: DIALOG) => {
  return dialog instanceof Success && dialog.data.name === name;
};
