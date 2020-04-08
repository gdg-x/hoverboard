import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Video = import('./video').Video;

describe('video', () => {
  it('matches the shape of the default data', () => {
    const videos: Video[] = Object.values(data['videos']);
    const keys: Array<keyof Video> = ['speakers', 'thumbnail', 'title', 'youtubeId'];
    expect(videos).toHaveLength(22);
    expect(allKeys(videos)).toStrictEqual(keys);
  });
});
