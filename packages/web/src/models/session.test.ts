import { describe, expect, it } from 'vitest';
import data from '../../../../docs/default-firebase-data.json';
import type { SessionData } from './session';
import { allKeys } from './utils';

describe('session', () => {
  it('matches the shape of the default data', () => {
    const sessions: SessionData[] = Object.values(data['sessions']);
    const keys: Array<keyof SessionData> = [
      'complexity',
      'day',
      'description',
      'endTime',
      'icon',
      'image',
      'language',
      'presentation',
      'speakers',
      'startTime',
      'tags',
      'title',
      'track',
      'videoId',
    ];

    // 40 sessions, and 6 copies of sessions the old schedule showed more than once.
    expect(sessions).toHaveLength(46);
    expect(allKeys(sessions)).toStrictEqual(keys);
  });
});
