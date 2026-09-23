import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectVideos } from '.';
import { Video } from '../../models/video';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('videos', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectVideos', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { videos: new Initialized() } as unknown as RootState;

    expect(selectVideos(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'videos',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('order'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Video[];
    const state = { videos: new Success(items) } as unknown as RootState;

    expect(selectVideos(state)).toStrictEqual(new Success(items));
  });
});
