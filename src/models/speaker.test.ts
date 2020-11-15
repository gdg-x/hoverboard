import data from '../../docs/default-firebase-data.json';
import { SpeakerData } from './speaker';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const speakers: SpeakerData[] = Object.values(data['speakers']);
    const keys: Array<keyof SpeakerData> = [
      'badges',
      'bio',
      'company',
      'companyLogo',
      'companyLogoUrl',
      'country',
      'featured',
      'name',
      'order',
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
