import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectPreviousSpeakersState } from '.';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { subscribeToPreviousSpeakers } from '../../db/previous-speakers';
import { RootState } from '..';

vi.mock('../../db/previous-speakers');
vi.mock('../dispatch');

describe('previous-speakers', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectPreviousSpeakersState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToPreviousSpeakers).mockReturnValue(new Success(vi.fn()));
    const state = { previousSpeakers: new Initialized() } as unknown as RootState;

    expect(selectPreviousSpeakersState(state)).toStrictEqual(new Pending());
    expect(subscribeToPreviousSpeakers).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as PreviousSpeaker[];
    const state = { previousSpeakers: new Success(items) } as unknown as RootState;

    expect(selectPreviousSpeakersState(state)).toStrictEqual(new Success(items));
  });
});
