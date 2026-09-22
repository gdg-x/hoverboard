import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Video } from '../models/video';
import { openVideoDialog } from '../store/ui';
import { featuredVideos, loading } from '../utils/data';
import type { FeaturedVideos } from './featured-videos';
import './featured-videos';

jest.mock('../store/ui', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('../store/ui')>('../store/ui'),
  openVideoDialog: jest.fn(),
}));

const mockOpenVideoDialog = mocked(openVideoDialog);

const video: Video = {
  speakers: 'Jane Doe',
  thumbnail: 'https://example.com/thumb.jpg',
  title: 'A Great Talk',
  youtubeId: 'abc123',
};

describe('featured-videos', () => {
  it('defines a component', () => {
    expect(customElements.get('featured-videos')).toBeDefined();
  });

  it('renders the loading state', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Pending();
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(loading);
  });

  it('renders the error state', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading videos.');
  });

  it('renders videos and cta on success', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Success([video]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(featuredVideos.title);
    expect(shadowRoot).toHaveTextContent(video.title);
    expect(shadowRoot.querySelector('lazy-image')).toHaveAttribute('src', video.thumbnail);
    expect(shadowRoot.querySelector('.cta-button')).toHaveAttribute('trailing-icon');
    expect(shadowRoot.querySelector('.cta-button hoverboard-icon')).toHaveAttribute(
      'name',
      'arrow-right-circle',
    );
  });

  it('opens the video dialog when a video is clicked', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Success([video]);
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('.video-item')!.click();

    expect(mockOpenVideoDialog).toHaveBeenCalledWith({
      title: `${video.title} by ${video.speakers}`,
      youtubeId: video.youtubeId,
    });
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<FeaturedVideos>(html`<featured-videos></featured-videos>`);

    expect(element.videos).toBeInstanceOf(Pending);
  });
});
