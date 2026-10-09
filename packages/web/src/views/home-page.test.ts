import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { html, nothing, render } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import { updateMetadata } from '../utils/metadata';
import { scrollToElement } from '../utils/scrolling';
import './home-page';
import { HomePage, homeBlocks } from './home-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
  scrollToElement: vi.fn(),
  POSITION: { TOP: 'top', BOTTOM: 'bottom' },
}));

const BANDS = [
  'about-block',
  'speakers-block',
  'tickets-block',
  'gallery-block',
  'about-organizer-block',
  'featured-videos',
  'latest-posts-block',
  'map-block',
  'partners-block',
];

const tones = (root: ShadowRoot) =>
  [...root.querySelectorAll('.band')].map((band) => band.getAttribute('data-tone'));

describe('home-page', () => {
  // Otherwise they can finish loading after jsdom is gone, which fails the run.
  beforeAll(() => homeBlocks);

  afterEach(() => {
    render(nothing, document.body);
  });

  it('defines a component', () => {
    expect(customElements.get('home-page')).toBeDefined();
  });

  it('renders the hero, then the blocks of every enabled feature', async () => {
    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.firstElementChild).toHaveProperty('localName', 'home-hero');
    for (const block of [...BANDS, 'subscribe-block']) {
      expect(shadowRoot.querySelector(block)).not.toBeNull();
    }
  });

  it('alternates the band colors over the blocks it shows, and keeps subscribe bright', async () => {
    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect([...shadowRoot.querySelectorAll('.band')].map(({ localName }) => localName)).toEqual(
      BANDS,
    );
    expect(tones(shadowRoot)).toEqual([
      'surface',
      'accent-4',
      'surface',
      'accent-2',
      'surface',
      'accent-1',
      'surface',
      'accent-4',
      'surface',
    ]);
    expect(shadowRoot.querySelector('subscribe-block')).not.toHaveClass('band');
  });

  it('keeps alternating when features are off', async () => {
    setFeatures({ speakers: false, gallery: false });

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(tones(shadowRoot).slice(0, 3)).toEqual(['surface', 'accent-4', 'surface']);
    expect(shadowRoot.querySelector('tickets-block')).toHaveAttribute('data-tone', 'accent-4');
  });

  it('leaves out the blocks of disabled features', async () => {
    setFeatures({ tickets: false, speakers: false, blog: false });

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('tickets-block')).toBeNull();
    expect(shadowRoot.querySelector('speakers-block')).toBeNull();
    expect(shadowRoot.querySelector('latest-posts-block')).toBeNull();
    expect(shadowRoot.querySelector('about-block')).not.toBeNull();
    expect(shadowRoot.querySelector('gallery-block')).not.toBeNull();
  });

  it('passes the build-time event state to the hero', async () => {
    const { shadowRoot } = await fixture<HomePage>(
      html`<home-page event-state="live" days-to-go="0"></home-page>`,
    );

    expect(shadowRoot.querySelector('home-hero')).toHaveAttribute('event-state', 'live');
  });

  it('scrolls to the tickets when the hero asks', async () => {
    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    shadowRoot
      .querySelector('home-hero')!
      .dispatchEvent(new CustomEvent('show-tickets', { bubbles: true, composed: true }));

    await vi.waitFor(() =>
      expect(scrollToElement).toHaveBeenCalledWith(shadowRoot.querySelector('#tickets')),
    );
  });

  it('updates metadata on connect', async () => {
    const mockUpdateMetadata = vi.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();

    await fixture<HomePage>(html`<home-page></home-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalled();
  });
});
