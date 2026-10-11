import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMessaging, onRegistered, register } from 'firebase/messaging';
import { firebaseApp } from '../../firebase';

export enum PROMPT_USER {
  YES = 'YES',
  NO = 'NO',
}

// Eslint doesn't like when using the built in type
export type NotificationPermission = typeof Notification.permission;

export type NotificationPermissionState = { value: RemoteData<Error, string> };
const initialState: NotificationPermissionState = {
  value: new Initialized(),
} as NotificationPermissionState;

export const requestNotificationPermission = createAsyncThunk<string | undefined, PROMPT_USER>(
  'notificationPermission/requestPermission',
  async (promptUser = PROMPT_USER.NO) => {
    const permission =
      promptUser === PROMPT_USER.YES
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission === 'granted') {
      try {
        const messaging = getMessaging(firebaseApp);
        // register() passes the Installation ID the server sends to, and needs the handler first.
        const installationId = new Promise<string>((resolve) => onRegistered(messaging, resolve));
        await register(messaging);
        return await installationId;
      } catch (error) {
        throw new Error('unsupported', { cause: error });
      }
    } else if (permission === 'default') {
      return undefined;
    } else {
      throw new Error('denied');
    }
  },
);

export const notificationPermissionSlice = createSlice({
  name: 'notificationPermission',
  initialState,
  reducers: {
    unsupported(state) {
      state.value = new Failure(new Error('unsupported'));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestNotificationPermission.pending, (state) => {
        state.value = new Pending();
      })
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        if (action.payload === undefined) {
          state.value = new Initialized();
        } else {
          state.value = new Success(action.payload);
        }
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.value = new Failure(new Error(action.error.message));
      });
  },
});

export const { unsupported: unsupportedNotificationPermission } =
  notificationPermissionSlice.actions;
export { initialState as initialNotificationPermissionState };
export default notificationPermissionSlice.reducer;
