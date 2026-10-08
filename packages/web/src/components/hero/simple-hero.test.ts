import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { heroDescriptions } from '../../config/site';
import type { SimpleHero } from './simple-hero';
import './simple-hero';

vi.mock('../../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/ui')>()),
  setHeroSettings: vi.fn(),
}));

describe('simple-hero', () => {
  it('defines a component', () => {
    expect(customElements.get('simple-hero')).toBeDefined();
  });

  it('defaults to the notFound page settings', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`<simple-hero></simple-hero>`);

    expect(shadowRoot.querySelector('hero-block')).not.toHaveAttribute('background-color');
    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent('Not Found');
    expect(shadowRoot.querySelector('.hero-description')).toBeNull();
  });

  it('renders the title and description for pages that have both', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(
      html`<simple-hero page="speakers"></simple-hero>`,
    );

    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent('Speakers');
    expect(shadowRoot.querySelector('.hero-description')).toHaveTextContent(
      heroDescriptions.speakers,
    );
  });

  it('renders only the title for pages without a description', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`<simple-hero page="blog"></simple-hero>`);

    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent('Blog');
    expect(shadowRoot.querySelector('.hero-description')).toBeNull();
  });

  it('renders slotted content inside the hero-block', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`
      <simple-hero page="faq"><p>slotted</p></simple-hero>
    `);

    const slot = shadowRoot.querySelector('hero-block slot')!;
    expect(slot).not.toBeNull();
  });
});
