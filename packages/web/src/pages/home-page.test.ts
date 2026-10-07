import { type MockedFunction, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { firebaseApp } from '../firebase';
import { isFeatureEnabled } from '../config/features';
import { openVideoDialog } from '../store/ui';
import { aboutBlock, dates, location } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import './home-page';
import { HomePage } from './home-page';

vi.mock('../utils/metadata');
vi.mock('../config/features', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../config/features')>()),
  isFeatureEnabled: vi.fn(() => true),
}));
vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
}));
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
  afterEach(() => {
    vi.mocked(isFeatureEnabled).mockImplementation(() => true);
  });

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
    vi.mocked(isFeatureEnabled).mockImplementation(
      (feature) => !['tickets', 'speakers', 'blog'].includes(feature),
    );

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('tickets-block')).toBeNull();
    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('speakers-block')).toBeNull();
    expect(shadowRoot.querySelector('latest-posts-block')).toBeNull();
    expect(shadowRoot.querySelector('about-block')).not.toBeNull();
    expect(shadowRoot.querySelector('gallery-block')).not.toBeNull();
  });

  it('does not render fork-me-block when the feature is off', async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature) => feature !== 'forkMe');
    (firebaseApp.options as { appId?: string }).appId = 'hoverboard-master';

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('fork-me-block')).toBeNull();

    delete (firebaseApp.options as { appId?: string }).appId;
  });

  it('updates metadata on connect', async () => {
    const mockUpdateMetadata = vi.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalled();
    expect(shadowRoot).toHaveTextContent(location.city);
    expect(shadowRoot).toHaveTextContent(dates);
  });

  it('does not render fork-me-block for a non-matching firebase project', async () => {
    (firebaseApp.options as { appId?: string }).appId = 'some-other-project';

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('fork-me-block')).toBeNull();
  });

  it('renders fork-me-block for a matching firebase project', async () => {
    (firebaseApp.options as { appId?: string }).appId = 'hoverboard-master';

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);

    expect(shadowRoot.querySelector('fork-me-block')).not.toBeNull();

    delete (firebaseApp.options as { appId?: string }).appId;
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
