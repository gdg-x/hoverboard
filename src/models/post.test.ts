import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Post = import('./post').Post;

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
