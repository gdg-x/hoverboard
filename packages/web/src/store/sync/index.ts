import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';

export interface SyncState {
  /** From the browser's `online` and `offline` events. The server, and the first render, assume online. */
  online: boolean;
}

const initialState: SyncState = { online: true };

const slice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
    },
  },
});

const { setOnline } = slice.actions;

export const selectOnline = (state: RootState): boolean => state.sync.online;

/** Follows the browser's connection. Call once, after the page hydrates. */
export const watchConnection = (): void => {
  const update = () => dispatch(setOnline(navigator.onLine));
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
};

/**
 * Whether a write that needs the network can start. Only the visitor's own documents sync later,
 * so other writes say why they can't while offline.
 */
export const canWriteNow = (): boolean => {
  if (selectOnline(getState())) return true;
  dispatch(
    queueSnackbar(
      msg('Connect to the internet to send this.', { id: 'store.offline.needs-network' }),
    ),
  );
  return false;
};

export default slice.reducer;
