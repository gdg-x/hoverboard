import { Feedback } from './feedback';
import { allKeys } from './utils';

describe('feedback', () => {
  it('matches the shape of the default data', () => {
    const feedback: Feedback[] = [
      {
        comment: 'Super awesome speaker',
        contentRating: 5,
        styleRating: 5,
      },
    ];
    const keys: Array<keyof Feedback> = ['comment', 'contentRating', 'styleRating'];
    expect(feedback).toHaveLength(1);
    expect(allKeys(feedback)).toStrictEqual(keys);
  });
});
