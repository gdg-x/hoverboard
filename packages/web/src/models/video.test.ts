import { describe, expect, it } from 'vitest';
import videoDocuments from '../../../../docs/sample-data/collections/videos.json';
import { allKeys } from './utils';
import type { Video } from './video';

describe('video', () => {
  it('matches the shape of the default data', () => {
    const videos: Video[] = Object.values(videoDocuments);
    // The query sorts by `order`, which the model doesn't read.
    const keys: Array<keyof Video | 'order'> = [
      'order',
      'speakers',
      'thumbnail',
      'title',
      'youtubeId',
    ];

    expect(videos).toHaveLength(22);
    expect(allKeys(videos)).toStrictEqual(keys);
  });
});
