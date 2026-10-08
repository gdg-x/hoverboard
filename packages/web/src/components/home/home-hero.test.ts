import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import {
  aboutBlock,
  featuredVideos,
  galleryBlock,
  heroDescriptions,
  location,
  title,
} from '../../config/site';
import { openVideoDialog } from '../../store/ui';
import type { HomeHero } from './home-hero';
import './home-hero';

vi.mock('../../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/ui')>()),
  openVideoDialog: vi.fn(),
}));

// The demo event is on October 13 and 14, 2017, in Kyiv.
const renderOn = async (date: string) => {
  vi.setSystemTime(new Date(date));
  const result = await fixture<HomeHero>(html`<home-hero></home-hero>`);
  await result.element.updateComplete;
  return result;
};

describe('home-hero', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    render(nothing, document.body);
  });

  it('names the event in the page heading, with its dates, place and description', async () => {
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('h1')).toHaveTextContent(title);
    const details = shadowRoot.querySelector('ul.details')!;
    expect(details).toHaveAttribute('aria-label', 'Event details');
    expect(details).toHaveTextContent('October 13 – 14, 2017');
    expect(details).toHaveTextContent(location.short);
    expect(shadowRoot).toHaveTextContent(heroDescriptions.home);
  });

  it('counts the days to go, and offers tickets and the highlights', async () => {
    const { element, shadowRoot } = await renderOn('2017-10-01T12:00:00Z');
    const showTickets = vi.fn();
    element.addEventListener('show-tickets', showTickets);

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('12 days to go');
    shadowRoot.querySelector<HTMLElement>('.buy-ticket')!.click();
    expect(showTickets).toHaveBeenCalledTimes(1);

    shadowRoot.querySelector<HTMLElement>('.watch-video')!.click();
    expect(openVideoDialog).toHaveBeenCalledWith({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  });

  it('says the event starts tomorrow on the day before', async () => {
    const { shadowRoot } = await renderOn('2017-10-12T12:00:00Z');

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Starts tomorrow');
  });

  it('links to the schedule when tickets are off', async () => {
    setFeatures({ tickets: false });

    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.schedule')).toHaveAttribute('href', '/schedule');
  });

  it('is live during the event, and links to what is on now', async () => {
    const { shadowRoot } = await renderOn('2017-10-13T12:00:00Z');

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Live now');
    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.schedule')).toHaveTextContent("See what's on now");
  });

  it('thanks attendees after the event, and links to the videos and photos', async () => {
    const { shadowRoot } = await renderOn('2017-10-20T12:00:00Z');

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Thanks for coming!');
    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.videos')).toHaveAttribute(
      'href',
      featuredVideos.callToAction.link,
    );
    expect(shadowRoot.querySelector('.photos')).toHaveAttribute(
      'href',
      galleryBlock.callToAction.link,
    );
  });

  it('offers the highlights after the event when videos and gallery are off', async () => {
    setFeatures({ videos: false, gallery: false });

    const { shadowRoot } = await renderOn('2017-10-20T12:00:00Z');

    expect(shadowRoot.querySelector('.videos')).toBeNull();
    expect(shadowRoot.querySelector('.watch-video')).not.toBeNull();
  });

  it('shows a decorative illustration on the dotted band', async () => {
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('.hero')).toHaveClass('pattern');
    expect(shadowRoot.querySelector('.art')).toHaveAttribute('aria-hidden', 'true');
    expect(shadowRoot.querySelector('.art svg')).not.toBeNull();
  });
});
