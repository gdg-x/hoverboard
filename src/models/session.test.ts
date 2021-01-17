import data from '../../docs/default-firebase-data.json';
import { SessionData } from './session';
import { allKeys } from './utils';

describe('session', () => {
  it('matches the shape of the default data', () => {
    const sessions: SessionData[] = Object.values(data['sessions']);
    const keys: Array<keyof SessionData> = [
      'complexity',
      'description',
      'extend',
      'icon',
      'image',
      'language',
      'presentation',
      'speakers',
      'tags',
      'title',
      'videoId',
    ];
    expect(sessions).toHaveLength(40);
    expect(allKeys(sessions)).toStrictEqual(keys);
  });
});
