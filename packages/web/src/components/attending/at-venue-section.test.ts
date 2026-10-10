import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { AtVenueSection } from './at-venue-section';
import './at-venue-section';

const config = vi.hoisted(() => ({
  atVenue: [] as { topic: string; title?: string; text: string }[],
}));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendingPage() {
    return { atVenue: config.atVenue };
  },
}));

const render = async () => {
  const result = await fixture<AtVenueSection>(html`
    <at-venue-section><h2 slot="heading">At the venue</h2></at-venue-section>
  `);
  await result.element.updateComplete;
  return result;
};

describe('at-venue-section', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    config.atVenue = [];
  });

  it('renders nothing without topics', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot, .items')).toBeNull();
  });

  it('shows each topic in order, with its icon and heading, or the title that replaces it', async () => {
    config.atVenue = [
      { topic: 'wifi', text: 'Network `DevFest`.' },
      { topic: 'food', text: 'Lunch is included.' },
      { topic: 'firstAid', title: 'Medics', text: 'At registration.' },
      { topic: 'lostAndFound', text: 'Ask at registration.' },
      { topic: 'other', title: 'Prayer room', text: 'Second floor.' },
    ];
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
    expect(
      [...shadowRoot.querySelectorAll('.item')].map((item) => [
        item.querySelector('hoverboard-icon')?.getAttribute('name'),
        item.querySelector('h3')?.textContent?.trim(),
      ]),
    ).toEqual([
      ['wifi', 'Wi-Fi'],
      ['lunch', 'Food and drink'],
      ['first-aid', 'Medics'],
      ['search', 'Lost and found'],
      ['help', 'Prayer room'],
    ]);
    expect(shadowRoot.querySelector('.item .text code')).toHaveTextContent('DevFest');
  });
});
