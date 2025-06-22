import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { Spied, spyOn } from 'jest-mock';
import { share } from './share';

type Open = (
  url?: string | URL | undefined,
  target?: string | undefined,
  features?: string | undefined,
) => Window | null;

describe('share', () => {
  let open: Spied<Open>;
  const features = (height: number) =>
    `menubar=no,toolbar=no,resizable=yes,scrollbars=yes,width=600,height=${height}`;
  const twitterUrl = [
    'https://twitter.com/intent/tweet',
    'text=Check%20out%20Awesome%20Schedule%20at%20%23DevFest%3A%20http%3A%2F%2Flocalhost%2F',
  ].join('?');

  beforeAll(() => {
    document.title = 'Awesome Schedule';
    open = spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    open.mockClear();
  });

  it('shares to Twitter', () => {
    share({ currentTarget: fixture('twitter') } as any as PointerEvent);

    expect(window.open).toHaveBeenCalledWith(twitterUrl, 'share', features(275));
  });

  it('shares to Facebook', () => {
    share({ currentTarget: fixture('facebook') } as any as PointerEvent);

    expect(window.open).toHaveBeenCalledWith(
      'https://www.facebook.com/sharer.php?u=http%3A%2F%2Flocalhost%2F&t=Awesome%20Schedule',
      'share',
      features(775),
    );
  });

  it('throws on unknown', () => {
    const event = { currentTarget: fixture('unknown') } as any as PointerEvent;

    expect(() => share(event)).toThrow('Unknown share target');
  });
});

const fixture = (share: string) => {
  const dom = document.createElement('button');
  dom.setAttribute('share', share);
  return dom;
};
