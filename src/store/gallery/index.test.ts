import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectGallery } from '.';
import { Photo } from '../../models/photo';
import { subscribeToGallery } from '../../db/gallery';
import { RootState } from '..';

vi.mock('../../db/gallery');
vi.mock('../dispatch');

describe('gallery', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectGallery', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToGallery).mockReturnValue(new Success(vi.fn()));
    const state = { gallery: new Initialized() } as unknown as RootState;

    expect(selectGallery(state)).toStrictEqual(new Pending());
    expect(subscribeToGallery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Photo[];
    const state = { gallery: new Success(items) } as unknown as RootState;

    expect(selectGallery(state)).toStrictEqual(new Success(items));
  });
});
