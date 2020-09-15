import data from '../../docs/default-firebase-data.json';
import { PreviousSession } from './previous-session';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const sessions: PreviousSession[] = Object.values(
      data['previousSpeakers']['adrian_kajda']['sessions']['2016']
    );
    const keys: Array<keyof PreviousSession> = ['presentation', 'tags', 'title', 'videoId'];
    expect(sessions).toHaveLength(1);
    expect(allKeys(sessions)).toStrictEqual(keys);
  });
});
