import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface SimpleInitialized {
  kind: 'initialized';
}

interface SimplePending {
  kind: 'pending';
}

interface SimpleFailure {
  kind: 'failure';
  error: Error;
}

interface SimpleSuccess<Data> {
  kind: 'success';
  data: Data;
}

// TODO: Move to separate file
export type SimpleRemoteData<Data> =
  | SimpleInitialized
  | SimplePending
  | SimpleFailure
  | SimpleSuccess<Data>;

// Eslint doesn't like when using the built in type
export type NotificationPermission = typeof Notification.permission;

export type NotificationPermissionState = SimpleRemoteData<
  Extract<NotificationPermission, 'granted'>
>;
const initialState: NotificationPermissionState = {
  kind: 'initialized',
} as NotificationPermissionState;

export const requestNotificationPermission = createAsyncThunk(
  'notificationPermission/requestPermission',
  async () => Notification.requestPermission()
);

export const notificationPermissionSlice = createSlice({
  name: 'notificationPermission',
  initialState,
  reducers: {
    update() {
      const { permission } = Notification;
      if (permission === 'granted') {
        return { kind: 'success', data: permission };
      } else if (permission === 'default') {
        return { kind: 'initialized' };
      } else {
        return { kind: 'failure', error: new Error('denied') };
      }
    },
    unsupported() {
      return { kind: 'failure', error: new Error('unsupported') };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestNotificationPermission.pending, (_state) => {
        return { kind: 'pending' };
      })
      .addCase(requestNotificationPermission.rejected, (_state, action) => {
        return { kind: 'failure', error: new Error(action.error.message) };
      });
  },
});

export const {
  unsupported: unsupportedNotificationPermission,
  update: updateNotificationPermission,
} = notificationPermissionSlice.actions;
export { initialState as initialNotificationPermissionState };
export default notificationPermissionSlice.reducer;
