import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Session } from '../../models/session';
import { dispatch } from '../dispatch';

export enum DIALOG {
  FEEDBACK = 'feedback',
  PARTNER = 'partner',
  SIGNIN = 'signin',
}

export interface SigninDialog {
  name: DIALOG.SIGNIN;
}
export interface PartnerDialog {
  name: DIALOG.PARTNER;
}
export interface FeedbackDialog {
  name: DIALOG.FEEDBACK;
  data: Pick<Session, 'id' | 'title'>;
}

export type Dialog = SigninDialog | PartnerDialog | FeedbackDialog;

export type DialogState = RemoteData<Error, Dialog>;

const initialState: DialogState = new Initialized();

const slice = createSlice({
  name: 'dialogs',
  initialState: initialState as DialogState,
  reducers: {
    open: (_state, action: PayloadAction<Dialog>): DialogState => new Success(action.payload),
    failure: (_state, action: PayloadAction<Error>): DialogState => new Failure(action.payload),
    close: (): DialogState => new Initialized(),
  },
});

const { open, failure, close } = slice.actions;

export const closeDialog = () => {
  dispatch(close());
};

export const setDialogError = (error: Error) => {
  dispatch(failure(error));
};

export const openSigninDialog = () => {
  dispatch(open({ name: DIALOG.SIGNIN }));
};

export const openPartnerDialog = () => {
  dispatch(open({ name: DIALOG.PARTNER }));
};

export const openFeedbackDialog = (data: FeedbackDialog['data']) => {
  dispatch(open({ name: DIALOG.FEEDBACK, data }));
};

export const selectIsDialogOpen = (state: RootState, name: DIALOG) => {
  return state.dialogs instanceof Success && state.dialogs.data.name === name;
};

export default slice.reducer;
