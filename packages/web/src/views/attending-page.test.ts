import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { location as venue } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import { scrollToElement } from '../utils/scrolling';
import type { AttendingPage } from './attending-page';
import './attending-page';

const config = vi.hoisted(() => ({
  attendance: 'inPerson' as 'inPerson' | 'online' | 'hybrid',
  stream: 'https://stream.example/live' as string | undefined,
  attendingPage: undefined as (typeof import('../config/site'))['attendingPage'],
}));

vi.mock('../config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/site')>();
  return {
    ...actual,
    get attendance() {
      return config.attendance;
    },
    get attendingPage() {
      return config.attendingPage;
    },
    get location() {
      return config.attendance === 'online' ? undefined : actual.location;
    },
    get stream() {
      return config.stream;
    },
  };
});
vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({ scrollToElement: vi.fn() }));

const render = async () => {
  const result = await fixture<AttendingPage>(html`<attending-page></attending-page>`);
  await result.element.updateComplete;
  return result;
};

const sectionIds = (root: ShadowRoot) =>
  [...root.querySelectorAll('section.band')].map((section) => section.id);
const tocLinks = (root: ShadowRoot) =>
  [...root.querySelectorAll('.toc a')].map((link) => [
    link.getAttribute('href'),
    link.textContent?.trim(),
  ]);

describe('attending-page', () => {
  beforeEach(() => {
    config.attendance = 'inPerson';
    config.stream = 'https://stream.example/live';
    config.attendingPage = undefined;
  });

  afterEach(() => {
    litRender(nothing, document.body);
    window.location.hash = '';
    vi.clearAllMocks();
  });

  it('has the hero with the dates and the venue, and sets the page metadata', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('simple-hero')).toHaveAttribute('page', 'attending');
    expect(shadowRoot.querySelector('.details')).toHaveTextContent('October 13 – 14, 2017');
    expect(shadowRoot.querySelector('.details')).toHaveTextContent(venue!.short);
    expect(updateMetadata).toHaveBeenCalled();
  });

  it('shows only the venue in person, without a table of contents for one section', async () => {
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['where']);
    expect(shadowRoot.querySelector('.toc')).toBeNull();
    const heading = shadowRoot.querySelector('#where venue-section h2[slot="heading"]');
    expect(heading).toHaveTextContent('Where it is');
    expect(shadowRoot.querySelector('#where')).toHaveAttribute('aria-labelledby', heading!.id);
  });

  it('shows the venue and joining online for a hybrid event, with a table of contents', async () => {
    config.attendance = 'hybrid';
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['where', 'online']);
    expect(tocLinks(shadowRoot)).toEqual([
      ['#where', 'Where it is'],
      ['#online', 'Joining online'],
    ]);
    expect(shadowRoot.querySelector('#online online-section')).toHaveProperty(
      'attendance',
      'hybrid',
    );
    expect(
      [...shadowRoot.querySelectorAll('section.band')].map((band) =>
        band.getAttribute('data-tone'),
      ),
    ).toEqual(['surface', 'accent-4']);
  });

  it('shows only joining online for an online event, and says online in the hero', async () => {
    config.attendance = 'online';
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['online']);
    expect(shadowRoot.querySelector('.details')).toHaveTextContent('Online');
  });

  it('leaves out joining online without a stream', async () => {
    config.attendance = 'hybrid';
    config.stream = undefined;
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['where']);
  });

  it('shows joining online without a stream when the organizers wrote about it', async () => {
    config.attendance = 'hybrid';
    config.stream = undefined;
    config.attendingPage = { online: 'Join the chat.' };
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['where', 'online']);
  });

  it("passes the venue's photo to the venue section", async () => {
    const photo = { image: '/images/venue.jpg', alt: 'The venue' };
    config.attendingPage = { photo };
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('venue-section')).toHaveProperty('photo', photo);
  });

  const everySection = {
    online: 'Join the chat.',
    floorPlan: { image: '/images/plan.svg', alt: 'The plan' },
    gettingThere: [{ mode: 'train' as const, text: 'Tram 6.' }],
    doors: [{ day: '2017-10-13', open: '08:00', close: '20:00' }],
    accessibility: 'Step-free.',
    accommodation: { hotels: [{ name: 'Hotel Example' }] },
    atVenue: [{ topic: 'wifi' as const, text: 'Network DevFest.' }],
  };

  it('shows every section with content in order, each with its heading', async () => {
    config.attendance = 'hybrid';
    config.attendingPage = everySection;
    const { shadowRoot } = await render();

    expect(tocLinks(shadowRoot)).toEqual([
      ['#where', 'Where it is'],
      ['#online', 'Joining online'],
      ['#floor-plan', 'Floor plan'],
      ['#getting-there', 'Getting there'],
      ['#doors', 'Doors'],
      ['#accessibility', 'Accessibility'],
      ['#accommodation', 'Accommodation'],
      ['#at-venue', 'At the venue'],
    ]);
    for (const section of shadowRoot.querySelectorAll('section.band')) {
      const heading = section.querySelector('h2[slot="heading"]')!;
      expect(heading.parentElement!.shadowRoot!.querySelector('slot')).not.toBeNull();
      expect(heading.id).toBe(`${section.id}-title`);
    }
  });

  it('leaves out the sections about the venue for an online event', async () => {
    config.attendance = 'online';
    config.attendingPage = everySection;
    const { shadowRoot } = await render();

    expect(sectionIds(shadowRoot)).toEqual(['online', 'accessibility']);
  });

  it('scrolls to the section in the address, which the browser cannot find in the shadow root', async () => {
    config.attendance = 'hybrid';
    window.location.hash = '#online';
    const { shadowRoot } = await render();

    expect(scrollToElement).toHaveBeenCalledWith(shadowRoot.querySelector('#online'));
  });
});
