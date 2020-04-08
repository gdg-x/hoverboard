import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Session = import('./session').Session;

describe('session', () => {
  it('matches the shape of the default data', () => {
    const sessions: Session[] = Object.values(data['sessions']);
    const keys: Array<keyof Session> = [
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
