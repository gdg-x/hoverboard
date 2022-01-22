import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMessaging, getToken } from 'firebase/messaging';
import { firebaseApp } from '../../firebase';
import { SimpleRemoteData } from '../../utils/simple-remote-data';

export enum PROMPT_USER {
  YES = 'YES',
  NO = 'NO',
}

const messaging = getMessaging(firebaseApp);

// Eslint doesn't like when using the built in type
export type NotificationPermission = typeof Notification.permission;

export type NotificationPermissionState = SimpleRemoteData<string>;
const initialState: NotificationPermissionState = {
  kind: 'initialized',
} as NotificationPermissionState;

export const requestNotificationPermission = createAsyncThunk<string | undefined, PROMPT_USER>(
  'notificationPermission/requestPermission',
  async (promptUser = PROMPT_USER.NO, _thunkAPI) => {
    const permission =
      promptUser === PROMPT_USER.YES
        ? await Notification.requestPermission()
        : Notification.permission;

    console.log('requestNotificationPermission.permission', permission);
    if (permission === 'granted') {
      const token = await getToken(messaging);
      console.log('requestNotificationPermission.token', token);
      return token;
    } else if (permission === 'default') {
      return undefined;
    } else {
      throw new Error('denied');
    }
  }
);

export const notificationPermissionSlice = createSlice({
  name: 'notificationPermission',
  initialState,
  reducers: {
    unsupported() {
      return { kind: 'failure', error: new Error('unsupported') };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestNotificationPermission.pending, (_state) => {
        return { kind: 'pending' };
      })
      .addCase(requestNotificationPermission.fulfilled, (_state, action) => {
        if (action.payload === undefined) {
          return { kind: 'initialized' };
        } else {
          return { kind: 'success', data: action.payload };
        }
      })
      .addCase(requestNotificationPermission.rejected, (_state, action) => {
        return { kind: 'failure', error: new Error(action.error.message) };
      });
  },
});

export const { unsupported: unsupportedNotificationPermission } =
  notificationPermissionSlice.actions;
export { initialState as initialNotificationPermissionState };
export default notificationPermissionSlice.reducer;
