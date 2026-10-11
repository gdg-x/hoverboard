import { describe, expect, it } from 'vitest';
import blog from '../../../../docs/sample-data/collections/blog.json';
import type { PostData } from './post';
import { allKeys } from './utils';

describe('post', () => {
  it('matches the shape of the default data', () => {
    const posts: PostData[] = Object.values(blog);
    const keys: Array<keyof PostData> = [
      'backgroundColor',
      'brief',
      'content',
      'image',
      'published',
      'source',
      'title',
    ];

    expect(posts).toHaveLength(5);
    expect(allKeys(posts)).toStrictEqual(keys);
  });
});
