import { Toast } from './toast';
import { allKeys } from './utils';

describe('toast', () => {
  it('matches the shape of the default data', () => {
    const feedback: Toast[] = [
      {
        message: 'Super awesome notification',
      },
      {
        duration: 1,
        message: 'Quick notification',
      },
      {
        action: {
          title: 'This is being logged',
          callback: console.log,
        },
        message: 'Log',
      },
    ];
    const keys: Array<keyof Toast> = ['action', 'duration', 'message'];
    expect(feedback).toHaveLength(3);
    expect(allKeys(feedback)).toStrictEqual(keys);
  });
});
