import data from '../../docs/default-firebase-data.json';
import { PostData } from './post';
import { allKeys } from './utils';

describe('post', () => {
  it('matches the shape of the default data', () => {
    const posts: PostData[] = Object.values(data['blog']);
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
