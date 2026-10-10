import { msg, str } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';

/** The listeners that report the visitor's own changes the server hasn't confirmed yet. */
export type PendingSource = 'featuredSessions' | 'feedback' | 'notificationsUsers';

export interface SyncState {
  /** From the browser's `online` and `offline` events. The server, and the first render, assume online. */
  online: boolean;
  /** What hasn't synced, such as bookmarked session IDs, by the listener that reports it. */
  pending: Partial<Record<PendingSource, string[]>>;
}

const initialState: SyncState = { online: true, pending: {} };

const slice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
    },
    setPending: (state, action: PayloadAction<{ source: PendingSource; ids: string[] }>) => {
      state.pending[action.payload.source] = action.payload.ids;
    },
    clearPending: (state) => {
      state.pending = {};
    },
  },
});

const { setOnline, setPending, clearPending } = slice.actions;

const NONE: string[] = [];

export const selectOnline = (state: RootState): boolean => state.sync.online;

export const selectPending = (state: RootState, source: PendingSource): string[] =>
  state.sync.pending[source] ?? NONE;

export const selectPendingCount = (state: RootState): number =>
  Object.values(state.sync.pending).reduce((count, ids) => count + ids.length, 0);

/** The header's label for the connection, or nothing while online with everything synced. */
export const syncLabel = (online: boolean, pending: number): string | undefined => {
  if (online) return pending ? msg('Syncing…', { id: 'shell.sync.syncing' }) : undefined;
  if (pending === 0) return msg('Offline', { id: 'shell.sync.offline' });
  return pending === 1
    ? msg('Offline · 1 change to sync', { id: 'shell.sync.offline-one' })
    : msg(str`Offline · ${pending} changes to sync`, { id: 'shell.sync.offline-many' });
};

/** Says that a change, such as a bookmark, hasn't synced yet. */
export const unsyncedMessage = (): string =>
  msg("Saved on this device. Syncs when you're online.", { id: 'shell.sync.unsynced' });

// Set when the site comes back online with changes to sync, until they have.
let announceWhenSynced = false;
let wasOnline = true;

const announceIfSynced = () => {
  if (!announceWhenSynced || selectPendingCount(getState()) > 0) return;
  announceWhenSynced = false;
  dispatch(queueSnackbar(msg('Back online. Your changes are saved.', { id: 'shell.sync.saved' })));
};

/** Follows the browser's connection. Call once, after the page hydrates. */
export const watchConnection = (): void => {
  const update = () => {
    const online = navigator.onLine;
    dispatch(setOnline(online));
    if (online && !wasOnline) {
      if (selectPendingCount(getState()) > 0) announceWhenSynced = true;
      else dispatch(queueSnackbar(msg('Back online.', { id: 'shell.sync.online' })));
    }
    if (!online) announceWhenSynced = false;
    wasOnline = online;
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
};

/** Records what a listener reports hasn't synced, such as the IDs of bookmarked sessions. */
export const setPendingIds = (source: PendingSource, ids: string[]): void => {
  dispatch(setPending({ source, ids }));
  announceIfSynced();
};

/** Forgets what hasn't synced, when the visitor signs out. */
export const resetPending = (): void => {
  dispatch(clearPending());
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
