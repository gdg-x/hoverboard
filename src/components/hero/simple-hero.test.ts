import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { heroSettings } from '../../utils/data';
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

    expect(shadowRoot.querySelector('hero-block')).toHaveAttribute(
      'background-color',
      heroSettings.notFound.background.color,
    );
    expect(shadowRoot.querySelector('hero-block')).toHaveAttribute(
      'font-color',
      heroSettings.notFound.fontColor,
    );
    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent(heroSettings.notFound.title);
    expect(shadowRoot.querySelector('.hero-description')).toBeNull();
  });

  it('renders the title and description for pages that have both', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(
      html`<simple-hero page="speakers"></simple-hero>`,
    );

    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent(heroSettings.speakers.title);
    expect(shadowRoot.querySelector('.hero-description')).toHaveTextContent(
      heroSettings.speakers.description,
    );
  });

  it('renders only the title for pages without a description', async () => {
    const { shadowRoot } = await fixture<SimpleHero>(html`<simple-hero page="blog"></simple-hero>`);

    expect(shadowRoot.querySelector('.hero-title')).toHaveTextContent(heroSettings.blog.title);
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
