import { type MockedFunction, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import { openVideoDialog } from '../store/ui';
import { aboutBlock, heroDescriptions, location } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import './home-page';
import { HomePage } from './home-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
  scrollToElement: vi.fn(),
  POSITION: { TOP: 'top', BOTTOM: 'bottom' },
}));
vi.mock('../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/ui')>()),
  openVideoDialog: vi.fn(),
  setHeroSettings: vi.fn(),
}));

describe('home-page', () => {
  it('defines a component', () => {
    expect(customElements.get('home-page')).toBeDefined();
  });

  it('renders the blocks of every enabled feature', async () => {
    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    for (const block of [
      'speakers-block',
      'subscribe-block',
      'tickets-block',
      'gallery-block',
      'featured-videos',
      'latest-posts-block',
      'map-block',
      'partners-block',
    ]) {
      expect(shadowRoot.querySelector(block)).not.toBeNull();
    }
    expect(shadowRoot.querySelector('.buy-ticket')).not.toBeNull();
  });

  it('leaves out the blocks of disabled features', async () => {
    setFeatures({ tickets: false, speakers: false, blog: false });

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('tickets-block')).toBeNull();
    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('speakers-block')).toBeNull();
    expect(shadowRoot.querySelector('latest-posts-block')).toBeNull();
    expect(shadowRoot.querySelector('about-block')).not.toBeNull();
    expect(shadowRoot.querySelector('gallery-block')).not.toBeNull();
  });

  it('does not render fork-me-block when the feature is off', async () => {
    setFeatures({ forkMe: false });

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('fork-me-block')).toBeNull();
  });

  it('updates metadata on connect', async () => {
    const mockUpdateMetadata = vi.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalled();
    expect(shadowRoot).toHaveTextContent(location.city);
    expect(shadowRoot).toHaveTextContent('October 13 – 14, 2017');
    expect(shadowRoot).toHaveTextContent(heroDescriptions.home);
  });

  it('renders fork-me-block when the feature is on', async () => {
    setFeatures({ forkMe: true });

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('fork-me-block')).not.toBeNull();
  });

  it('opens the video dialog when the watch video button is clicked', async () => {
    const mockOpenVideoDialog = openVideoDialog as MockedFunction<typeof openVideoDialog>;
    mockOpenVideoDialog.mockClear();

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);
    fireEvent.click(shadowRoot.querySelector('.watch-video') as Element);

    expect(mockOpenVideoDialog).toHaveBeenCalledWith({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  });
});
