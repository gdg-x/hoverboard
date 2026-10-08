import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { HeroBlock } from './hero-block';
import './hero-block';

describe('hero-block', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('uses the first accent and a pattern by default', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(html`<hero-block></hero-block>`);

    expect(element).toHaveAttribute('tone', '1');
    expect(shadowRoot.querySelector('.hero')).toHaveClass('pattern');
    expect(shadowRoot.querySelector('img')).toBeNull();
  });

  it('reflects the tone, so the band takes that accent', async () => {
    const { element } = await fixture<HeroBlock>(html`<hero-block tone="3"></hero-block>`);

    expect(element).toHaveAttribute('tone', '3');
  });

  it('puts the text over a decorative photo', async () => {
    const { shadowRoot } = await fixture<HeroBlock>(
      html`<hero-block background-image="/example.jpg"></hero-block>`,
    );

    expect(shadowRoot.querySelector('.hero')).toHaveClass('photo');
    expect(shadowRoot.querySelector('img')).toHaveAttribute('src', '/example.jpg');
    expect(shadowRoot.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('shows its content', async () => {
    await fixture<HeroBlock>(html` <hero-block><h1 class="hero-title">Schedule</h1></hero-block> `);

    expect(screen.getByRole('heading', { level: 1, name: 'Schedule' })).toBeVisible();
  });
});
