import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectBlogPosts } from '.';
import { Post } from '../../models/post';
import { subscribeToBlog } from '../../db/blog';
import { RootState } from '..';

vi.mock('../../db/blog');
vi.mock('../dispatch');

describe('blog', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectBlogPosts', () => {
  it('subscribes to the blog collection on first read', () => {
    vi.mocked(subscribeToBlog).mockReturnValue(new Success(vi.fn()));
    const state = { blog: new Initialized() } as unknown as RootState;

    expect(selectBlogPosts(state)).toStrictEqual(new Pending());
    expect(subscribeToBlog).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
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
