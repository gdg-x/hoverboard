import { describe, expect, it, onTestFinished, vi } from 'vitest';
import reducer, {
  canWriteNow,
  resetPending,
  selectOnline,
  selectPending,
  selectPendingCount,
  setPendingIds,
  syncLabel,
  watchConnection,
} from '.';
import { store } from '..';

const lastSnackbar = () => store.getState().snackbars.at(-1)?.label;

const connection = () => {
  const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  onTestFinished(() => onLine.mockRestore());
  return (online: boolean) => {
    onLine.mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  };
};

describe('sync', () => {
  it('assumes online with nothing to sync, so the first render matches the server', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ online: true, pending: {} });
  });

  it('follows the online and offline events, and says when it is back online', () => {
    const go = connection();
    watchConnection();

    go(false);
    expect(selectOnline(store.getState())).toBe(false);
    go(true);
    expect(selectOnline(store.getState())).toBe(true);
    expect(lastSnackbar()).toBe('Back online.');
  });

  it('waits for changes made offline to sync before saying they are saved', () => {
    const go = connection();
    go(false);
    setPendingIds('featuredSessions', ['session-1', 'session-2']);
    setPendingIds('feedback', ['session-3']);
    expect(selectPendingCount(store.getState())).toBe(3);
    expect(selectPending(store.getState(), 'feedback')).toEqual(['session-3']);

    go(true);
    expect(lastSnackbar()).not.toBe('Back online. Your changes are saved.');
    setPendingIds('featuredSessions', []);
    expect(lastSnackbar()).not.toBe('Back online. Your changes are saved.');
    setPendingIds('feedback', []);
    expect(lastSnackbar()).toBe('Back online. Your changes are saved.');
  });

  it('forgets what has not synced on sign-out', () => {
    setPendingIds('notificationsUsers', ['user-1']);
    resetPending();
    expect(selectPendingCount(store.getState())).toBe(0);
  });

  it('labels the connection for the header', () => {
    expect(syncLabel(true, 0)).toBeUndefined();
    expect(syncLabel(true, 2)).toBe('Syncing…');
    expect(syncLabel(false, 0)).toBe('Offline');
    expect(syncLabel(false, 1)).toBe('Offline · 1 change to sync');
    expect(syncLabel(false, 3)).toBe('Offline · 3 changes to sync');
  });

  it('lets writes that need the network start only online, and says why otherwise', () => {
    const go = connection();
    go(true);
    expect(canWriteNow()).toBe(true);

    go(false);
    expect(canWriteNow()).toBe(false);
    expect(lastSnackbar()).toBe('Connect to the internet to send this.');
    go(true);
  });
});
