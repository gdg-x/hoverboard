import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectRawSpeakersState } from '.';
import type { Speaker } from '../../models/speaker';
import { subscribeToSpeakers } from '../../db/speakers';
import type { RootState } from '..';

vi.mock('../../db/speakers');
vi.mock('../dispatch');

describe('speakers', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectRawSpeakersState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToSpeakers).mockReturnValue(new Success(vi.fn()));
    const state = { speakers: new Initialized() } as unknown as RootState;

    expect(selectRawSpeakersState(state)).toStrictEqual(new Pending());
    expect(subscribeToSpeakers).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Speaker[];
    const state = { speakers: new Success(items) } as unknown as RootState;

    expect(selectRawSpeakersState(state)).toStrictEqual(new Success(items));
  });
});
