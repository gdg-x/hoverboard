import { Success } from '@abraham/remotedata';
import { DialogState } from '../store/dialogs/state';
import { DIALOGS } from '../store/dialogs/types';

export const isDialogOpen = (dialog: DialogState, name: DIALOGS) => {
  return dialog instanceof Success && dialog.data.name === name;
};
