import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { MapBlock } from './map-block';
import './map-block';

const config = vi.hoisted(() => ({ online: false }));

vi.mock('../../config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/site')>();
  return {
    ...actual,
    get location() {
      return config.online ? undefined : actual.location;
    },
  };
});

describe('map-block', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('defines a component', () => {
    expect(customElements.get('map-block')).toBeDefined();
  });

  it('shows the venue in its band, under the "Location" title', async () => {
    const { shadowRoot } = await fixture<MapBlock>(html`<map-block></map-block>`);
    const venue = shadowRoot.querySelector('venue-section.inner')!;

    expect(venue.querySelector('h2[slot="heading"].band-title')).toHaveTextContent('Location');
    expect(venue.shadowRoot!.querySelector('.venue')).not.toBeNull();
  });

  it('renders nothing without a venue', async () => {
    config.online = true;
    try {
      const { shadowRoot } = await fixture<MapBlock>(html`<map-block></map-block>`);

      expect(shadowRoot.querySelector('venue-section')).toBeNull();
    } finally {
      config.online = false;
    }
  });
});
