import { describe, expect, it } from 'vitest';
import previousSpeakers from '../../../../docs/sample-data/collections/previousSpeakers.json';
import type { PreviousSpeaker } from './previous-speaker';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const speakers: PreviousSpeaker[] = Object.values(previousSpeakers);
    const keys: Array<keyof PreviousSpeaker> = [
      'bio',
      'company',
      'companyLogo',
      'country',
      'id',
      'name',
      'order',
      'photoUrl',
      'sessions',
      'socials',
      'title',
    ];

    expect(speakers).toHaveLength(22);
    expect(allKeys(speakers)).toStrictEqual(keys);
  });
});
