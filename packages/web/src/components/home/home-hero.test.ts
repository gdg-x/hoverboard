import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { setFeatures } from '../../../__tests__/helpers/features';
import { setStoreState } from '../../../__tests__/helpers/store';
import {
  aboutBlock,
  featuredVideos,
  galleryBlock,
  heroDescriptions,
  location,
  title,
} from '../../config/site';
import type { Ticket } from '../../models/ticket';
import { openVideoDialog } from '../../store/ui';
import type { HomeHero } from './home-hero';
import './home-hero';

const config = vi.hoisted(() => ({
  decorations: true,
  attendance: 'inPerson' as 'inPerson' | 'online' | 'hybrid',
  stream: 'https://example.com/live',
  highlights: true,
  callForPapers: undefined as { url: string; closes: string } | undefined,
}));

vi.mock('../../config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/site')>();
  return {
    ...actual,
    get decorations() {
      return config.decorations;
    },
    get attendance() {
      return config.attendance;
    },
    get location() {
      return config.attendance === 'online' ? undefined : actual.location;
    },
    get stream() {
      return config.stream;
    },
    get callForPapers() {
      return config.callForPapers;
    },
    get aboutBlock() {
      const { howItWas, ...callToAction } = actual.aboutBlock.callToAction;
      return {
        ...actual.aboutBlock,
        callToAction: config.highlights ? { ...callToAction, howItWas } : callToAction,
      };
    },
  };
});

vi.mock('../../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/ui')>()),
  openVideoDialog: vi.fn(),
}));

// The demo event is on October 13 and 14, 2017, in Kyiv.
const ticket = { name: 'Regular', url: 'https://example.com/t', available: true } as Ticket;
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
    vi.restoreAllMocks();
    render(nothing, document.body);
    config.decorations = true;
    config.attendance = 'inPerson';
    config.highlights = true;
    config.callForPapers = undefined;
  });

  it('names the event in the page heading, with its dates, place and description', async () => {
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('h1')).toHaveTextContent(title);
    const details = shadowRoot.querySelector('ul.details')!;
    expect(details).toHaveAttribute('aria-label', 'Event details');
    expect(details).toHaveTextContent('October 13 – 14, 2017');
    expect(details).toHaveTextContent(location!.short);
    expect(shadowRoot).toHaveTextContent(heroDescriptions.home);
  });

  it('says the event is online instead of naming a venue', async () => {
    config.attendance = 'online';
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');
    const place = shadowRoot.querySelectorAll('ul.details hb-chip')[1]!;

    expect(place).toHaveTextContent(/^Online$/);
    expect(place.querySelector('hoverboard-icon')).toHaveAttribute('name', 'monitor');
  });

  it('names the venue and online for a hybrid event', async () => {
    config.attendance = 'hybrid';
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');
    const place = shadowRoot.querySelectorAll('ul.details hb-chip')[1]!;

    expect(place).toHaveTextContent(`${location!.short} · Online`);
    expect(place.querySelector('hoverboard-icon')).toHaveAttribute('name', 'location');
  });

  it('links the place to the attending page, when it is on', async () => {
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('hb-chip.place')).toHaveAttribute('href', '/attending');
    render(nothing, document.body);

    setFeatures({ attending: false });
    const off = await renderOn('2017-10-01T12:00:00Z');

    expect(off.shadowRoot.querySelector('hb-chip.place')).not.toHaveAttribute('href');
  });

  it('counts the days to go, and offers the ticket on sale and the schedule', async () => {
    setStoreState({ tickets: new Success([ticket]) });
    const { element, shadowRoot } = await renderOn('2017-10-01T12:00:00Z');
    const showTickets = vi.fn();
    element.addEventListener('show-tickets', showTickets);

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('12 days to go');
    expect(shadowRoot.querySelector('.buy-ticket')).toHaveAttribute('variant', 'cta');
    expect(shadowRoot.querySelector('.schedule')).toHaveAttribute('variant', 'outlined');
    expect(shadowRoot.querySelector('.watch-video')).toBeNull();
    shadowRoot.querySelector<HTMLElement>('.buy-ticket')!.click();
    expect(showTickets).toHaveBeenCalledTimes(1);
  });

  it('offers the highlights when it has fewer than two steps', async () => {
    vi.setSystemTime(new Date('2017-10-01T12:00:00Z'));
    const { shadowRoot } = await fixture<HomeHero>(
      html`<home-hero .presence="${{ schedule: false }}"></home-hero>`,
    );

    expect(shadowRoot.querySelector('.updates')).toHaveAttribute('href', '/#subscribe');
    expect(shadowRoot.querySelector('.updates')).toHaveTextContent('Get updates');
    expect(shadowRoot.querySelector('.watch-video')).toHaveAttribute('variant', 'outlined');
    shadowRoot.querySelector<HTMLElement>('.watch-video')!.click();
    expect(openVideoDialog).toHaveBeenCalledWith({
      title: aboutBlock.callToAction.howItWas!.label,
      youtubeId: aboutBlock.callToAction.howItWas!.youtubeId,
    });
  });

  it('has no highlights without a video', async () => {
    config.highlights = false;
    vi.setSystemTime(new Date('2017-10-01T12:00:00Z'));
    const { shadowRoot } = await fixture<HomeHero>(
      html`<home-hero .presence="${{ schedule: false }}"></home-hero>`,
    );

    expect(shadowRoot.querySelector('.updates')).not.toBeNull();
    expect(shadowRoot.querySelector('.watch-video')).toBeNull();
  });

  it("doesn't offer tickets that aren't on sale", async () => {
    setStoreState({ tickets: new Success([{ ...ticket, soldOut: true }]) });
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.schedule')).toHaveAttribute('variant', 'cta');
    expect(shadowRoot.querySelector('.updates')).toHaveAttribute('variant', 'outlined');
  });

  it('asks speakers to submit a talk while the call for papers is open', async () => {
    config.callForPapers = { url: 'https://example.com/cfp', closes: '2017-09-01' };

    const { shadowRoot } = await renderOn('2017-08-01T12:00:00Z');

    expect(shadowRoot.querySelector('.submit-talk')).toHaveAttribute(
      'href',
      'https://example.com/cfp',
    );
    expect(shadowRoot.querySelector('.submit-talk')).toHaveAttribute('variant', 'cta');
    expect(shadowRoot.querySelector('.submit-talk')).toHaveTextContent('Submit a talk');
    expect(shadowRoot.querySelector('.schedule')).toHaveAttribute('variant', 'outlined');
    render(nothing, document.body);

    const { shadowRoot: closed } = await renderOn('2017-09-02T12:00:00Z');

    expect(closed.querySelector('.submit-talk')).toBeNull();
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

  it('offers neither tickets nor the schedule when the build found none', async () => {
    vi.setSystemTime(new Date('2017-10-01T12:00:00Z'));
    const { shadowRoot } = await fixture<HomeHero>(
      html`<home-hero .presence="${{ tickets: false, schedule: false }}"></home-hero>`,
    );

    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.schedule')).toBeNull();
    expect(shadowRoot.querySelector('.watch-video')).not.toBeNull();
  });

  it('is live during the event, and links to what is on now, then the attending page', async () => {
    const { shadowRoot } = await renderOn('2017-10-13T12:00:00Z');

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Live now');
    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.watch-live')).toBeNull();
    expect(shadowRoot.querySelector('.schedule')).toHaveTextContent("See what's on now");
    const attending = shadowRoot.querySelector('.attending');
    expect(attending).toHaveAttribute('href', '/attending');
    expect(attending).toHaveAttribute('variant', 'outlined');
    expect(attending).not.toHaveAttribute('target');
    expect(attending).toHaveTextContent('Info for attendees');
    await expectNoAxeViolations(shadowRoot.host);
  });

  it("doesn't link to the attending page during an online event", async () => {
    config.attendance = 'online';
    const { shadowRoot } = await renderOn('2017-10-13T12:00:00Z');

    expect(shadowRoot.querySelector('.attending')).toBeNull();
  });

  it('says when tickets go on sale while none is on sale', async () => {
    setStoreState({
      tickets: new Success([
        { ...ticket, salesOpen: '2017-09-01' },
        { ...ticket, salesOpen: '2017-08-15' },
      ]),
    });
    const { shadowRoot } = await renderOn('2017-08-01T12:00:00Z');

    expect(shadowRoot.querySelector('.buy-ticket')).toBeNull();
    expect(shadowRoot.querySelector('.sale')).toHaveTextContent('Tickets on sale August 15');
    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('73 days to go');
    await expectNoAxeViolations(shadowRoot.host);
    render(nothing, document.body);

    const { shadowRoot: onSale } = await renderOn('2017-08-15T12:00:00Z');

    expect(onSale.querySelector('.buy-ticket')).not.toBeNull();
    expect(onSale.querySelector('.sale')).toBeNull();
  });

  it("doesn't say when tickets go on sale without tickets to sell", async () => {
    setStoreState({
      tickets: new Success([{ ...ticket, salesOpen: '2017-09-01', soldOut: true }]),
    });
    const { shadowRoot } = await renderOn('2017-08-01T12:00:00Z');

    expect(shadowRoot.querySelector('.sale')).toBeNull();
  });

  it('links to the stream, then what is on now, during an online event', async () => {
    config.attendance = 'online';
    const { shadowRoot } = await renderOn('2017-10-13T12:00:00Z');

    expect(shadowRoot.querySelector('.watch-live')).toHaveAttribute('href', config.stream);
    expect(shadowRoot.querySelector('.watch-live')).toHaveAttribute('target', '_blank');
    expect(shadowRoot.querySelector('.watch-live')).toHaveTextContent('Watch live');
    expect(shadowRoot.querySelector('.schedule')).toHaveAttribute('variant', 'outlined');
  });

  it('adds the event to a calendar while it is upcoming', async () => {
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');
    const calendar = shadowRoot.querySelector('add-to-calendar');

    expect(calendar).toHaveAttribute('size', 'l');
    expect(calendar!.event).toMatchObject({ title, allDay: true });
    render(nothing, document.body);

    const { shadowRoot: live } = await renderOn('2017-10-13T12:00:00Z');

    expect(live.querySelector('add-to-calendar')).toBeNull();
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

  it('has no illustration with decorations off', async () => {
    setFeatures({ demo: false });
    config.decorations = false;
    const { shadowRoot } = await renderOn('2017-10-01T12:00:00Z');

    expect(shadowRoot.querySelector('.art')).toBeNull();
    expect(shadowRoot.querySelector('h1')).toHaveTextContent(title);
  });
});
