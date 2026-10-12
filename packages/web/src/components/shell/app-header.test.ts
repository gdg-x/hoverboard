import { Success } from '@abraham/remotedata';
import { fireEvent } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { deepQuerySelector, screen, within } from 'shadow-dom-testing-library';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { eventDates, featuredVideos } from '../../config/site';
import type { Ticket } from '../../models/ticket';
import type { HbDialog } from '../ui/hb-dialog';
import { demoBanner, type AppHeader } from './app-header';
import './app-header';

const render = async (path = '/') => {
  const { element, shadowRoot } = await fixture<AppHeader>(
    html`<app-header path="${path}"></app-header>`,
  );
  await element.updateComplete;
  return {
    element,
    shadowRoot,
    // Only the navigation links: the call to action in the bar can also link to the schedule.
    nav: within(deepQuerySelector(shadowRoot, '.bar .nav')!),
    sheet: deepQuerySelector<HbDialog>(shadowRoot, 'hb-dialog')!,
    callToAction: () => deepQuerySelector(shadowRoot, '.actions .cta'),
  };
};

const tickets = new Success([
  { name: 'Early bird', url: 'https://example.com/early', available: false },
  { name: 'Regular', url: 'https://example.com/regular', available: true },
] as Ticket[]);

describe('app-header', () => {
  // Otherwise it can finish loading after jsdom is gone, which fails the run.
  beforeAll(() => demoBanner);

  beforeEach(() => {
    // The day before the event, so tickets are on sale.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${eventDates.start}T00:00:00Z`).getTime() - 2 * 86_400_000);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with a link that skips to the content', async () => {
    await render();
    const [first] = screen.getAllByShadowRole('link');

    expect(first).toBe(screen.getByShadowRole('link', { name: 'Skip to content' }));
    expect(first).toHaveAttribute('href', '#main');
  });

  it('shows the demo banner above the bar only when demo is on', async () => {
    setFeatures({ demo: true });
    const { shadowRoot } = await render();
    expect(deepQuerySelector(shadowRoot, 'demo-banner + header')).toBeInTheDocument();

    litRender(nothing, document.body);
    setFeatures({ demo: false });
    const { shadowRoot: withoutDemo } = await render();
    expect(deepQuerySelector(withoutDemo, 'demo-banner')).toBeNull();
  });

  it("marks the navigation link of the page's path as the current page", async () => {
    const { nav } = await render('/sessions/101');

    expect(nav.getByShadowRole('link', { name: 'Schedule' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(nav.getByShadowRole('link', { name: 'Speakers' })).not.toHaveAttribute('aria-current');
  });

  it('opens the navigation sheet from the menu button, and closes it after a link', async () => {
    const { element, sheet } = await render();

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Menu' }));
    await element.updateComplete;
    expect(sheet.open).toBe(true);

    fireEvent.click(within(sheet).getByShadowRole('link', { name: 'Blog' }));
    await element.updateComplete;
    expect(sheet.open).toBe(false);
  });

  it('follows the path and closes the sheet when another page swaps in', async () => {
    const { element, nav, sheet } = await render('/');
    fireEvent.click(await screen.findByShadowRole('button', { name: 'Menu' }));
    await element.updateComplete;
    window.history.pushState({}, '', '/blog');

    document.dispatchEvent(new Event('astro:after-swap'));
    await element.updateComplete;

    expect(element.path).toBe('/blog');
    expect(sheet.open).toBe(false);
    expect(nav.getByShadowRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page');
    window.history.pushState({}, '', '/');
  });

  it('calls to buy the first available ticket', async () => {
    setStoreState({ tickets });
    const { callToAction } = await render();

    expect(callToAction()).toHaveTextContent('Buy ticket');
    expect(callToAction()).toHaveAttribute('variant', 'cta');
    expect(callToAction()).toHaveAttribute('href', 'https://example.com/regular');
  });

  it('calls to watch the videos once the event is over', async () => {
    vi.setSystemTime(new Date(`${eventDates.end}T00:00:00Z`).getTime() + 2 * 86_400_000);
    setStoreState({ tickets });
    const { callToAction } = await render();

    expect(callToAction()).toHaveTextContent('Watch the videos');
    expect(callToAction()).toHaveAttribute('href', featuredVideos.callToAction.link);
    expect(callToAction()).toHaveAttribute('target', '_blank');
  });

  it("doesn't call to buy tickets that aren't on sale", async () => {
    setStoreState({
      tickets: new Success([
        { name: 'Regular', url: 'https://example.com/regular', available: true, soldOut: true },
      ] as Ticket[]),
    });
    const { callToAction } = await render('/blog');

    expect(callToAction()).toHaveAttribute('href', '/schedule');
  });

  it('calls to see the schedule without tickets, then to get updates, then to nothing', async () => {
    setFeatures({ tickets: false });
    const { callToAction } = await render();

    expect(callToAction()).toHaveAttribute('href', '/schedule');

    setFeatures({ tickets: false, schedule: false, mySchedule: false, feedback: false });
    const { callToAction: updates } = await render('/blog');

    expect(updates()).toHaveTextContent('Get updates');
    expect(updates()).toHaveAttribute('href', '/#subscribe');
    expect(updates()).not.toHaveAttribute('target');

    setFeatures({ tickets: false, schedule: false, mySchedule: false, subscribe: false });
    const { callToAction: noCallToAction } = await render('/team');

    expect(noCallToAction()).toBeNull();
  });

  it('links to the schedule once in the bar and the sheet when the navigation has it', async () => {
    setFeatures({ tickets: false });
    const { callToAction, sheet } = await render();

    // Hidden by a container query wherever the navigation shows.
    expect(callToAction()).toHaveClass('in-nav');
    expect(within(sheet).getAllByShadowRole('link', { name: 'Schedule' })).toHaveLength(1);
  });

  it('leaves out links and the call to action for features the build found no content for', async () => {
    setFeatures({ tickets: false });
    const { element, nav, sheet, callToAction } = await render();

    element.presence = { speakers: false, schedule: false, blog: true, team: false };
    await element.updateComplete;

    for (const name of ['Speakers', 'Schedule', 'Team']) {
      expect(nav.queryByShadowRole('link', { name })).toBeNull();
      expect(within(sheet).queryByShadowRole('link', { name })).toBeNull();
    }
    expect(nav.getByShadowRole('link', { name: 'Blog' })).toBeInTheDocument();
    expect(nav.getByShadowRole('link', { name: 'Attending' })).toBeInTheDocument();
    expect(callToAction()).toHaveTextContent('Get updates');
  });

  it('shows the account menu only when a feature needs sign-in', async () => {
    const { shadowRoot } = await render();
    expect(deepQuerySelector(shadowRoot, 'account-menu')).toBeInTheDocument();

    setFeatures({ mySchedule: false, feedback: false });
    const { shadowRoot: withReactions } = await render('/blog');
    expect(deepQuerySelector(withReactions, 'account-menu')).toBeInTheDocument();

    setFeatures({ mySchedule: false, feedback: false, reactions: false });
    const { shadowRoot: withoutAccount } = await render('/team');
    expect(deepQuerySelector(withoutAccount, 'account-menu')).toBeNull();
  });

  it('shows the notifications bell only when notifications are on', async () => {
    setFeatures({ notifications: false });
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'notification-toggle')).toBeNull();
  });
});
