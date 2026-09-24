import { MockedFunction, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { firebaseApp } from '../firebase';
import { openVideoDialog } from '../store/ui';
import { aboutBlock, dates, location } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './home-page';
import { HomePage } from './home-page';

vi.mock('../utils/metadata');
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
  it('defines a component', () => {
    expect(customElements.get('home-page')).toBeDefined();
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
    (firebaseApp.options as { appId?: string }).appId = 'hoverboard-dev';

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
