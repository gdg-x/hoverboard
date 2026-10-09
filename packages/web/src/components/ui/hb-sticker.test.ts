import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-sticker';
import type { HbSticker } from './hb-sticker';

describe('hb-sticker', () => {
  it('rotates by its tilt', async () => {
    const { shadowRoot } = await fixture<HbSticker>(
      html`<hb-sticker tilt="4" accent="2">Live now</hb-sticker>`,
    );
    const sticker = shadowRoot.querySelector<HTMLElement>('.sticker')!;

    expect(sticker.style.getPropertyValue('--hb-sticker-tilt')).toBe('4deg');
  });

  it('tilts left by default', async () => {
    const { shadowRoot } = await fixture<HbSticker>(html`<hb-sticker>Free</hb-sticker>`);

    expect(
      shadowRoot
        .querySelector<HTMLElement>('.sticker')!
        .style.getPropertyValue('--hb-sticker-tilt'),
    ).toBe('-3deg');
  });
});
