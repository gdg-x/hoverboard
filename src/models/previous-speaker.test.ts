import data from '../../docs/default-firebase-data.json';
import { PreviousSpeaker } from './previous-speaker';
import { allKeys } from './utils';

describe('speaker', () => {
  it('matches the shape of the default data', () => {
    const speakers: PreviousSpeaker[] = Object.values(data['previousSpeakers']);
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
