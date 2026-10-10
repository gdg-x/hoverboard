import { describe, expect, it, onTestFinished, vi } from 'vitest';
import reducer, { canWriteNow, selectOnline, watchConnection } from '.';
import type { RootState } from '..';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';

vi.mock('../dispatch');

const offline = () => {
  const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  onTestFinished(() => onLine.mockRestore());
  return onLine;
};

describe('sync', () => {
  it('assumes online until the browser says otherwise, so the first render matches the server', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ online: true });
  });

  it('follows the online and offline events', () => {
    const onLine = offline();

    watchConnection();
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'sync/setOnline', payload: false });

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'sync/setOnline', payload: true });

    onLine.mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'sync/setOnline', payload: false });
  });

  it('lets writes that need the network start only online, and says why otherwise', () => {
    vi.mocked(getState).mockReturnValue({ sync: { online: true } } as RootState);
    expect(canWriteNow()).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();

    vi.mocked(getState).mockReturnValue({ sync: { online: false } } as RootState);
    expect(canWriteNow()).toBe(false);
    expect(dispatch).toHaveBeenCalledWith(queueSnackbar('Connect to the internet to send this.'));
    expect(selectOnline({ sync: { online: false } } as RootState)).toBe(false);
  });
});
