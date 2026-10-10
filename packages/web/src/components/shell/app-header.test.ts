import { Success } from '@abraham/remotedata';
import { fireEvent, within } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { eventDates } from '../../config/site';
import type { Ticket } from '../../models/ticket';
import type { HbDialog } from '../ui/hb-dialog';
import { demoBanner, type AppHeader } from './app-header';
import './app-header';

const render = async (path = '/') => {
  const { element, shadowRoot, shadowRootForWithin } = await fixture<AppHeader>(
    html`<app-header path="${path}"></app-header>`,
  );
  await element.updateComplete;
  return {
    element,
    shadowRoot,
    bar: within(shadowRoot.querySelector<HTMLElement>('.bar')!),
    view: within(shadowRootForWithin),
    sheet: shadowRoot.querySelector<HbDialog>('hb-dialog')!,
    callToAction: () => shadowRoot.querySelector('.actions .cta'),
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
    const { view } = await render();

    expect(view.getAllByRole('link')[0]).toHaveTextContent('Skip to content');
    expect(view.getAllByRole('link')[0]).toHaveAttribute('href', '#main');
  });

  it('shows the demo banner above the bar only when demo is on', async () => {
    setFeatures({ demo: true });
    const { shadowRoot } = await render();
    expect(shadowRoot.querySelector('demo-banner + header')).toBeInTheDocument();

    litRender(nothing, document.body);
    setFeatures({ demo: false });
    const { shadowRoot: withoutDemo } = await render();
    expect(withoutDemo.querySelector('demo-banner')).toBeNull();
  });

  it("marks the navigation link of the page's path as the current page", async () => {
    const { bar } = await render('/sessions/101');

    expect(bar.getByRole('link', { name: 'Schedule' })).toHaveAttribute('aria-current', 'page');
    expect(bar.getByRole('link', { name: 'Speakers' })).not.toHaveAttribute('aria-current');
  });

  it('opens the navigation sheet from the menu button, and closes it after a link', async () => {
    const { element, shadowRoot, sheet } = await render();

    fireEvent.click(shadowRoot.querySelector('.menu-button')!);
    await element.updateComplete;
    expect(sheet.open).toBe(true);

    fireEvent.click(within(sheet).getByRole('link', { name: 'Blog' }));
    await element.updateComplete;
    expect(sheet.open).toBe(false);
  });

  it('follows the path and closes the sheet when another page swaps in', async () => {
    const { element, shadowRoot, bar, sheet } = await render('/');
    fireEvent.click(shadowRoot.querySelector('.menu-button')!);
    await element.updateComplete;
    window.history.pushState({}, '', '/blog');

    document.dispatchEvent(new Event('astro:after-swap'));
    await element.updateComplete;

    expect(element.path).toBe('/blog');
    expect(sheet.open).toBe(false);
    expect(bar.getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page');
    window.history.pushState({}, '', '/');
  });

  it('calls to buy the first available ticket', async () => {
    setStoreState({ tickets });
    const { callToAction } = await render();

    expect(callToAction()).toHaveTextContent('Buy ticket');
    expect(callToAction()).toHaveAttribute('variant', 'cta');
    expect(callToAction()).toHaveAttribute('href', 'https://example.com/regular');
  });

  it('calls to see the schedule once the event is over', async () => {
    vi.setSystemTime(new Date(`${eventDates.end}T00:00:00Z`).getTime() + 2 * 86_400_000);
    setStoreState({ tickets });
    const { callToAction } = await render();

    expect(callToAction()).toHaveTextContent('Schedule');
    expect(callToAction()).toHaveAttribute('href', '/schedule');
  });

  it('calls to see the schedule without tickets, and to nothing without a schedule', async () => {
    setFeatures({ tickets: false });
    const { callToAction } = await render();

    expect(callToAction()).toHaveAttribute('href', '/schedule');

    setFeatures({ tickets: false, schedule: false, mySchedule: false, feedback: false });
    const { callToAction: noCallToAction } = await render('/blog');

    expect(noCallToAction()).toBeNull();
  });

  it('links to the schedule once in the bar and the sheet when the navigation has it', async () => {
    setFeatures({ tickets: false });
    const { callToAction, sheet } = await render();

    // Hidden by a container query wherever the navigation shows.
    expect(callToAction()).toHaveClass('in-nav');
    expect(within(sheet).getAllByRole('link', { name: 'Schedule' })).toHaveLength(1);
  });

  it('shows the account menu only when a feature needs sign-in', async () => {
    const { shadowRoot } = await render();
    expect(shadowRoot.querySelector('account-menu')).toBeInTheDocument();

    setFeatures({ mySchedule: false, feedback: false });
    const { shadowRoot: withReactions } = await render('/blog');
    expect(withReactions.querySelector('account-menu')).toBeInTheDocument();

    setFeatures({ mySchedule: false, feedback: false, reactions: false });
    const { shadowRoot: withoutAccount } = await render('/team');
    expect(withoutAccount.querySelector('account-menu')).toBeNull();
  });

  it('shows the notifications bell only when notifications are on', async () => {
    setFeatures({ notifications: false });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('notification-toggle')).toBeNull();
  });
});
