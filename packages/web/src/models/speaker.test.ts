import { describe, expect, it } from 'vitest';
import speakerDocuments from '../../../../docs/sample-data/collections/speakers.json';
import type { SpeakerData } from './speaker';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const speakers: SpeakerData[] = Object.values(speakerDocuments);
    const keys: Array<keyof SpeakerData> = [
      'badges',
      'bio',
      'company',
      'companyLogo',
      'companyLogoUrl',
      'country',
      'featured',
      'name',
      'photo',
      'photoUrl',
      'pronouns',
      'shortBio',
      'socials',
      'title',
    ];

    expect(speakers).toHaveLength(27);
    expect(allKeys(speakers)).toStrictEqual(keys);
  });
});
