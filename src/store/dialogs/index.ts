import { Failure, Initialized, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { DialogForm } from '../../models/dialog-form';
import { Session } from '../../models/session';
import { dispatch } from '../dispatch';

export enum DIALOG {
  FEEDBACK = 'feedback',
  SUBSCRIBE = 'subscribe',
  SIGNIN = 'signin',
}

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

export const openSubscribeDialog = (data: SubscribeDialog['data']) => {
  dispatch(open({ name: DIALOG.SUBSCRIBE, data }));
};

export const openFeedbackDialog = (data: FeedbackDialog['data']) => {
  dispatch(open({ name: DIALOG.FEEDBACK, data }));
};

export const selectIsDialogOpen = (state: RootState, name: DIALOG) => {
  return state.dialogs instanceof Success && state.dialogs.data.name === name;
};

export default slice.reducer;
