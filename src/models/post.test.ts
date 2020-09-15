import data from '../../docs/default-firebase-data.json';
import { Post } from './post';
import { allKeys } from './utils';

describe('post', () => {
  it('matches the shape of the default data', () => {
    const posts: Post[] = Object.values(data['blog']);
    const keys: Array<keyof Post> = [
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
