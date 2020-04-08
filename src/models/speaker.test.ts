import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Speaker = import('./speaker').Speaker;

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const speakers: Speaker[] = Object.values(data['speakers']);
    const keys: Array<keyof Speaker> = [
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
