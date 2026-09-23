import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import reducer, {
  resetFeaturedSessions,
  selectFeaturedSessions,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '.';
import { bookmarked } from '../../utils/data';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { selectUserId } from '../user';
import { RootState } from '..';

vi.mock('firebase/firestore');
vi.mock('../dispatch');
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({
    type: 'snackbars/queueSnackbar',
    payload: label,
  })),
}));
vi.mock('../user', () => ({
  selectUserId: vi.fn(),
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('featuredSessions', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('handles its state transitions', () => {
    const data = { 'session-1': true };
    const error = new Error('boom');

    expect(reducer(new Initialized(), { type: 'featuredSessions/pending' })).toStrictEqual(
      new Pending(),
    );
    expect(
      reducer(new Pending(), { type: 'featuredSessions/success', payload: data }),
    ).toStrictEqual(new Success(data));
    expect(
      reducer(new Pending(), { type: 'featuredSessions/failure', payload: error }),
    ).toStrictEqual(new Failure(error));
    expect(reducer(new Success(data), { type: 'featuredSessions/reset' })).toStrictEqual(
      new Initialized(),
    );
  });
});

describe('setUserFeaturedSessions', () => {
  it('cleans falsy session ids, persists them, and queues the added snackbar', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(queueSnackbar).mockReturnValue({
      type: 'snackbars/queueSnackbar',
      payload: bookmarked.added,
    } as never);

    await setUserFeaturedSessions(
      'user-1',
      { 'session-1': true, 'session-2': false, 'session-3': 0 as never },
      true,
    );

    expect(setDoc).toHaveBeenCalledWith('doc-ref', { 'session-1': true });
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'featuredSessions/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'featuredSessions/success',
        payload: { 'session-1': true },
      }),
    );
    expect(queueSnackbar).toHaveBeenCalledWith(bookmarked.added);
    expect(dispatch).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'snackbars/queueSnackbar',
        payload: bookmarked.added,
      }),
    );
  });

  it('dispatches failure when persisting featured sessions fails', async () => {
    const error = new Error('write failed');
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockRejectedValue(error);

    await setUserFeaturedSessions('user-1', { 'session-1': true }, false);

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'featuredSessions/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'featuredSessions/failure',
        payload: error,
      }),
    );
    expect(queueSnackbar).not.toHaveBeenCalled();
  });
});

describe('featured session selectors', () => {
  it('dispatches a lazy fetch the first time the state is read for a signed-in user', async () => {
    vi.mocked(selectUserId).mockReturnValue('user-1');
    vi.mocked(getState).mockReturnValue({} as RootState);
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(getDoc).mockResolvedValue({
      data: () => ({ 'session-1': true }),
    } as never);
    const state = {
      featuredSessions: new Initialized(),
    } as unknown as RootState;

    expect(selectFeaturedSessionsState(state)).toStrictEqual(new Initialized());

    await flushPromises();

    expect(selectUserId).toHaveBeenCalledWith({});
    expect(getDoc).toHaveBeenCalledWith('doc-ref');
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'featuredSessions/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'featuredSessions/success',
        payload: { 'session-1': true },
      }),
    );
  });

  it('does nothing when lazy fetch runs without a signed-in user', async () => {
    vi.mocked(selectUserId).mockReturnValue(undefined);
    vi.mocked(getState).mockReturnValue({} as RootState);
    const state = {
      featuredSessions: new Initialized(),
    } as unknown as RootState;

    expect(selectFeaturedSessionsState(state)).toStrictEqual(new Initialized());

    await flushPromises();

    expect(getDoc).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('returns featured session data only when loaded', () => {
    const loadedState = {
      featuredSessions: new Success({ 'session-1': true }),
    } as unknown as RootState;
    const pendingState = {
      featuredSessions: new Pending(),
    } as unknown as RootState;

    expect(selectFeaturedSessions(loadedState)).toStrictEqual({ 'session-1': true });
    expect(selectFeaturedSessions(pendingState)).toStrictEqual({});
  });
});

describe('resetFeaturedSessions', () => {
  it('dispatches reset', () => {
    resetFeaturedSessions();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'featuredSessions/reset' }),
    );
  });
});
