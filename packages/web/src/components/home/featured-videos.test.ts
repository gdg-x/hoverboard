import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Video } from '../../models/video';
import { openVideoDialog } from '../../store/ui';
import { featuredVideos } from '../../config/site';
import type { FeaturedVideos } from './featured-videos';
import './featured-videos';

vi.mock('../../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/ui')>()),
  openVideoDialog: vi.fn(),
}));

const mockOpenVideoDialog = vi.mocked(openVideoDialog);

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

    expect(shadowRoot).toHaveTextContent('Loading...');
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
    expect(shadowRoot.querySelector('img')).toHaveAttribute('src', video.thumbnail);
    expect(shadowRoot.querySelector('.all')).toHaveAttribute(
      'href',
      featuredVideos.callToAction.link,
    );
  });

  it('opens the video dialog when a video is clicked', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Success([video]);
    await element.updateComplete;

    shadowRoot.querySelector<HTMLButtonElement>('button.video')!.click();

    expect(mockOpenVideoDialog).toHaveBeenCalledWith({
      title: `${video.title} by ${video.speakers}`,
      youtubeId: video.youtubeId,
    });
  });

  it('scrolls the rail with the previous and next buttons, which turn off at the ends', async () => {
    const { element, shadowRoot } = await fixture<FeaturedVideos>(
      html`<featured-videos></featured-videos>`,
    );
    element.videos = new Success([video, video, video, video]);
    await element.updateComplete;
    const rail = shadowRoot.querySelector<HTMLElement>('.rail')!;
    const previous = shadowRoot.querySelector('hb-icon-button.previous')!;
    const next = shadowRoot.querySelector('hb-icon-button.next')!;
    Object.defineProperties(rail, {
      clientWidth: { value: 300 },
      scrollWidth: { value: 1000 },
      scrollLeft: { value: 0, writable: true },
    });
    rail.scrollBy = vi.fn();

    rail.dispatchEvent(new Event('scroll'));
    await element.updateComplete;

    expect(previous).toHaveAttribute('disabled');
    expect(next).not.toHaveAttribute('disabled');
    expect(previous).toHaveAttribute('label', 'Previous videos');

    next.shadowRoot!.querySelector('button')!.click();
    expect(rail.scrollBy).toHaveBeenCalledWith({ left: 270 });

    rail.scrollLeft = 700;
    rail.dispatchEvent(new Event('scroll'));
    await element.updateComplete;

    expect(previous).not.toHaveAttribute('disabled');
    expect(next).toHaveAttribute('disabled');
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<FeaturedVideos>(html`<featured-videos></featured-videos>`);

    expect(element.videos).toBeInstanceOf(Pending);
  });
});
