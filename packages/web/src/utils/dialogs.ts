import { Success } from '@abraham/remotedata';
import { DialogState, DIALOG } from '../store/dialogs';

export const isDialogOpen = (dialog: DialogState, name: DIALOG) => {
  return dialog instanceof Success && dialog.data.name === name;
};
