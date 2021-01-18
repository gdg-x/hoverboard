import { FeedbackData } from './feedback';
import { allKeys } from './utils';

describe('feedback', () => {
  it('matches the shape of the default data', () => {
    const feedback: FeedbackData[] = [
      {
        comment: 'Super awesome speaker',
        contentRating: 5,
        styleRating: 5,
      },
    ];
    const keys: Array<keyof FeedbackData> = ['comment', 'contentRating', 'styleRating'];
    expect(feedback).toHaveLength(1);
    expect(allKeys(feedback)).toStrictEqual(keys);
  });
});
