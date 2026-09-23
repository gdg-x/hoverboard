import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectGallery } from '.';
import { Photo } from '../../models/photo';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('gallery', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectGallery', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { gallery: new Initialized() } as unknown as RootState;

    expect(selectGallery(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'gallery',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('order'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Photo[];
    const state = { gallery: new Success(items) } as unknown as RootState;

    expect(selectGallery(state)).toStrictEqual(new Success(items));
  });
});
