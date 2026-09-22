import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { firebaseApp } from '../firebase';
import { openVideoDialog } from '../store/ui/actions';
import { aboutBlock, dates, location } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './home-page';
import { HomePage } from './home-page';

jest.mock('../utils/metadata');
jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
  scrollToElement: jest.fn(),
  POSITION: { TOP: 'top', BOTTOM: 'bottom' },
}));
jest.mock('../store/ui/actions', () => ({
  openVideoDialog: jest.fn(),
  setHeroSettings: jest.fn(),
}));

describe('home-page', () => {
  it('defines a component', () => {
    expect(customElements.get('home-page')).toBeDefined();
  });

  it('updates metadata on connect', async () => {
    const mockUpdateMetadata = jest.mocked(updateMetadata);
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
    const mockOpenVideoDialog = openVideoDialog as jest.MockedFunction<typeof openVideoDialog>;
    mockOpenVideoDialog.mockClear();

    const { shadowRoot } = await fixture<HomePage>(html`<home-page></home-page>`);
    fireEvent.click(shadowRoot.querySelector('.watch-video') as Element);

    expect(mockOpenVideoDialog).toHaveBeenCalledWith({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  });
});
