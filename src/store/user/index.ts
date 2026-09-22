import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { dispatch } from '../dispatch';
import { FirebaseUser, toUser, User } from '../../models/user';

export type UserState = RemoteData<Error, User>;

const initialState: UserState = new Initialized();

const slice = createSlice({
  name: 'user',
  initialState: initialState as UserState,
  reducers: {
    setSuccess: (_state, action: PayloadAction<User>): UserState => new Success(action.payload),
    reset: (): UserState => new Initialized(),
  },
});

const { setSuccess, reset } = slice.actions;

export const setUserSuccess = setSuccess;
export const setUser = (user: FirebaseUser) => dispatch(setSuccess(toUser(user)));
export const removeUser = () => dispatch(reset());

export const selectUser = (state: RootState): UserState => state.user;

export const selectUserId = (state: RootState): string | undefined => {
  if (state.user instanceof Success) {
    return state.user.data.uid;
  }
  return undefined;
};

export default slice.reducer;
