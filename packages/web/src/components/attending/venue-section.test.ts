import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { location as venue, mapsScriptUrl } from '../../config/site';
import { applyColorScheme } from '../../utils/color-scheme';
import { directionLinks, type VenueSection } from './venue-section';
import './venue-section';

const location = venue!;
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

const mapsScripts = () =>
  [...document.head.querySelectorAll('script')].filter(({ src }) => src === mapsScriptUrl);

const render = () =>
  fixture<VenueSection>(html` <venue-section><h2 slot="heading">Where it is</h2></venue-section> `);

afterEach(() => {
  litRender(nothing, document.body);
  mapsScripts().forEach((script) => script.remove());
  applyColorScheme(document, null);
});

describe('venue-section', () => {
  it('renders nothing without a venue', async () => {
    config.online = true;
    try {
      const { shadowRoot } = await render();

      expect(shadowRoot.querySelector('.layout')).toBeNull();
    } finally {
      config.online = false;
    }
  });

  it("puts the page's heading before the venue, its address and directions in three map apps", async () => {
    const { element, shadowRoot } = await render();

    expect(
      shadowRoot.querySelector<HTMLSlotElement>('slot[name="heading"]')!.assignedElements(),
    ).toEqual([element.querySelector('h2')]);
    expect(shadowRoot.querySelector('.venue')).toHaveTextContent(location.name);
    expect(shadowRoot.querySelector('address')).toHaveTextContent(location.address);
    expect(shadowRoot).toHaveTextContent(location.description);
    expect(shadowRoot.querySelector('#directions')).toHaveTextContent('Directions');
    expect(
      [...shadowRoot.querySelectorAll('.directions hb-button')].map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(directionLinks(location).map(({ url }) => url));
  });

  it('links to directions by address, or by the pin for OpenStreetMap', () => {
    expect(
      directionLinks({
        address: '1 Main St, Lviv',
        pointer: { latitude: 49.8, longitude: 23.9 },
      }),
    ).toEqual([
      {
        name: 'Google Maps',
        url: 'https://www.google.com/maps/dir/?api=1&destination=1+Main+St%2C+Lviv',
      },
      { name: 'Apple Maps', url: 'https://maps.apple.com/?daddr=1+Main+St%2C+Lviv' },
      {
        name: 'OpenStreetMap',
        url: 'https://www.openstreetmap.org/?mlat=49.8&mlon=23.9#map=17/49.8/23.9',
      },
    ]);
  });

  it('says the map is available online instead of loading it offline', async () => {
    const { element, shadowRoot } = await render();
    element['online'] = false;
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('.show-map')!.click();

    expect(shadowRoot.querySelector('.placeholder')).toHaveTextContent(
      "Available when you're online.",
    );
    expect(shadowRoot.querySelector('.show-map')).toHaveAttribute('disabled');
    expect(mapsScripts()).toHaveLength(0);
  });

  it('loads Google Maps only when asked, in the color scheme the page shows', async () => {
    const { element, shadowRoot } = await render();

    expect(mapsScripts()).toHaveLength(0);
    expect(shadowRoot.querySelector('gmp-map')).toBeNull();

    applyColorScheme(document, 'dark');
    shadowRoot.querySelector<HTMLElement>('.show-map')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.show-map')).toHaveAttribute('disabled');
    expect(mapsScripts()).toHaveLength(1);

    customElements.define('gmp-map', class extends HTMLElement {});
    mapsScripts()[0]!.dispatchEvent(new Event('load'));
    await vi.waitFor(() => expect(shadowRoot.querySelector('gmp-map')).not.toBeNull());

    expect(shadowRoot.querySelector('gmp-map')).toHaveAttribute('color-scheme', 'DARK');
    expect(shadowRoot.querySelector('gmp-advanced-marker')).toHaveAttribute('title', location.name);
  });
});
