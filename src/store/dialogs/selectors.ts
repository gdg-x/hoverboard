import { Success } from '@abraham/remotedata';
import { RootState } from '..';
import { DIALOG } from './types';

export const selectIsDialogOpen = (state: RootState, name: DIALOG) => {
  return state.dialogs instanceof Success && state.dialogs.data.name === name;
};
