import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SpeakerPhoto } from './speaker-photo';
import './speaker-photo';

const render = async (props: Partial<SpeakerPhoto>) => {
  const result = await fixture<SpeakerPhoto>(html`<speaker-photo src="/ada.jpg"></speaker-photo>`);
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return { ...result, img: result.shadowRoot.querySelector('img')! };
};

describe('speaker-photo', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('is a lazy, decorative medium photo by default', async () => {
    const { element, img } = await render({});

    expect(element).toHaveAttribute('size', 'm');
    expect(img).toHaveAttribute('src', '/ada.jpg');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('width', '120');
    expect(img).toHaveAttribute('height', '120');
  });

  it.each([
    ['xs', '28'],
    ['s', '72'],
    ['m', '120'],
    ['l', '160'],
  ] as const)('sets the %s size on the host and the image', async (size, pixels) => {
    const { element, img } = await render({ size });

    expect(element).toHaveAttribute('size', size);
    expect(img).toHaveAttribute('width', pixels);
    expect(img).toHaveAttribute('height', pixels);
  });

  it('names the photo, and loads it at once when asked', async () => {
    const { img } = await render({ alt: 'Ada Lovelace', loading: 'eager' });

    expect(img).toHaveAttribute('alt', 'Ada Lovelace');
    expect(img).toHaveAttribute('loading', 'eager');
  });
});
