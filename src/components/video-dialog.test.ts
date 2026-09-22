import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { closeVideoDialog } from '../store/ui';
import type { VideoDialog } from './video-dialog';
import './video-dialog';

jest.mock('../store/ui', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('../store/ui')>('../store/ui'),
  closeVideoDialog: jest.fn(),
}));

const mockCloseVideoDialog = mocked(closeVideoDialog);

describe('video-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('video-dialog')).toBeDefined();
  });

  it('renders a closed dialog by default', async () => {
    const { shadowRoot } = await fixture<VideoDialog>(html`<video-dialog></video-dialog>`);

    expect(shadowRoot.querySelector('hoverboard-dialog')).not.toHaveAttribute('open');
  });

  it('renders the video title and id when opened', async () => {
    const { element, shadowRoot } = await fixture<VideoDialog>(html`<video-dialog></video-dialog>`);
    element['video'] = { open: true, youtubeId: 'abc123', title: 'A great talk' };
    await element.updateComplete;

    expect(shadowRoot.querySelector('hoverboard-dialog')).toHaveAttribute('open');
    expect(shadowRoot.querySelector('[slot="headline"]')).toHaveTextContent('A great talk');
    expect(shadowRoot.querySelector('lite-youtube')).toHaveAttribute('videoid', 'abc123');
    expect(shadowRoot.querySelector('lite-youtube')).toHaveAttribute('videotitle', 'A great talk');
  });

  it('dispatches closeVideoDialog when the dialog is closed', async () => {
    const { shadowRoot } = await fixture<VideoDialog>(html`<video-dialog></video-dialog>`);

    shadowRoot.querySelector('hoverboard-dialog')!.dispatchEvent(new Event('closed'));

    expect(mockCloseVideoDialog).toHaveBeenCalled();
  });

  it('closes the dialog when the close button is clicked', async () => {
    const { shadowRoot } = await fixture<VideoDialog>(html`<video-dialog></video-dialog>`);
    const dialog = shadowRoot.querySelector('hoverboard-dialog') as HTMLElement & {
      close: () => void;
    };
    dialog.close = jest.fn();

    shadowRoot.querySelector<HTMLElement>('md-outlined-button')!.click();

    expect(dialog.close).toHaveBeenCalled();
  });
});
