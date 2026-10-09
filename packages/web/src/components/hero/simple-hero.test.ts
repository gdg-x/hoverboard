import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { heroDescriptions } from '../../config/site';
import type { SimpleHero } from './simple-hero';
import './simple-hero';

describe('simple-hero', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('defaults to the notFound page', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`<simple-hero></simple-hero>`);

    expect(shadowRoot.querySelector('h1.hero-title')).toHaveTextContent('Not Found');
    expect(shadowRoot.querySelector('.hero-description')).toBeNull();
  });

  it('renders the title as the heading and the description', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(
      html`<simple-hero page="speakers"></simple-hero>`,
    );

    expect(shadowRoot.querySelector('h1.hero-title')).toHaveTextContent('Speakers');
    expect(shadowRoot.querySelector('.hero-description')).toHaveTextContent(
      heroDescriptions.speakers,
    );
  });

  it("gives each section's pages their own accent", async () => {
    const tones: Record<string, string> = {};
    for (const page of ['speakers', 'blog', 'schedule', 'team'] as const) {
      const { shadowRoot } = await fixture<SimpleHero>(
        html`<simple-hero page="${page}"></simple-hero>`,
      );
      tones[page] = shadowRoot.querySelector('hero-block')!.getAttribute('tone')!;
      litRender(nothing, document.body);
    }

    expect(tones).toEqual({ speakers: '1', blog: '2', schedule: '3', team: '4' });
  });

  it('renders only the title for pages without a description', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`<simple-hero page="blog"></simple-hero>`);

    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent('Blog');
    expect(shadowRoot.querySelector('.hero-description')).toBeNull();
  });

  it('passes its own content to the hero', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`
      <simple-hero page="faq"><p>slotted</p></simple-hero>
    `);

    expect(shadowRoot.querySelector('hero-block slot')).not.toBeNull();
  });
});
