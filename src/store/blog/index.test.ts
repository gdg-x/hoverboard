import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectBlogPosts } from '.';
import { Post } from '../../models/post';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('blog', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectBlogPosts', () => {
  it('subscribes to the blog collection ordered by published date, descending, on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { blog: new Initialized() } as unknown as RootState;

    expect(selectBlogPosts(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'blog',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('published', 'desc'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const posts: Post[] = [
      {
        id: '1',
        title: 'Hello',
        brief: '',
        content: '',
        published: '',
        backgroundColor: '',
        image: '',
        source: '',
      } as Post,
    ];
    const state = { blog: new Success(posts) } as unknown as RootState;

    expect(selectBlogPosts(state)).toStrictEqual(new Success(posts));
  });
});
