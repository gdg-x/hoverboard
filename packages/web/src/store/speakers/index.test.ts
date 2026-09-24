import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectSpeakersState } from '.';
import { SpeakerWithTags } from '../../models/speaker';
import { subscribeToSpeakers } from '../../db/speakers';
import { RootState } from '..';

vi.mock('../../db/speakers');
vi.mock('../dispatch');

describe('speakers', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectSpeakersState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToSpeakers).mockReturnValue(new Success(vi.fn()));
    const state = { speakers: new Initialized() } as unknown as RootState;

    expect(selectSpeakersState(state)).toStrictEqual(new Pending());
    expect(subscribeToSpeakers).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as SpeakerWithTags[];
    const state = { speakers: new Success(items) } as unknown as RootState;

    expect(selectSpeakersState(state)).toStrictEqual(new Success(items));
  });
});
