import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectVideos } from '.';
import { Video } from '../../models/video';
import { subscribeToVideos } from '../../db/videos';
import { RootState } from '..';

vi.mock('../../db/videos');
vi.mock('../dispatch');

describe('videos', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectVideos', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToVideos).mockReturnValue(new Success(vi.fn()));
    const state = { videos: new Initialized() } as unknown as RootState;

    expect(selectVideos(state)).toStrictEqual(new Pending());
    expect(subscribeToVideos).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Video[];
    const state = { videos: new Success(items) } as unknown as RootState;

    expect(selectVideos(state)).toStrictEqual(new Success(items));
  });
});
