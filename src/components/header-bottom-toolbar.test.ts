import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Day } from '../models/day';
import { mySchedule } from '../utils/data';
import type { HeaderBottomToolbar } from './header-bottom-toolbar';

import './header-bottom-toolbar';

const days: Day[] = [
  {
    date: '2024-01-01',
    dateReadable: 'January 1',
    tracks: [{ title: 'Track 1' }],
    timeslots: [],
  },
  {
    date: '2024-01-02',
    dateReadable: 'January 2',
    tracks: [{ title: 'Track 1' }],
    timeslots: [],
  },
];

describe('header-bottom-toolbar', () => {
  it('defines a component', () => {
    expect(customElements.get('header-bottom-toolbar')).toBeDefined();
  });

  it('shows the content loader while pending', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Pending();
    await element.updateComplete;

    expect(shadowRoot.querySelector('content-loader')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('nav.nav-items')).toHaveAttribute('hidden');
  });

  it('renders a tab for every day', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Success(days);
    await element.updateComplete;

    const tabs = shadowRoot.querySelectorAll('.nav-item');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('data-day', '2024-01-01');
    expect(tabs[0]?.querySelector('a')).toHaveAttribute('href', '/schedule/2024-01-01');
    expect(tabs[0]).toHaveTextContent('January 1');
    expect(shadowRoot.querySelector('content-loader')).toHaveAttribute('hidden');
  });

  it('keeps query params in day links', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Success(days);
    element.location = {
      params: {},
      pathname: '/schedule/2024-01-01',
      search: '?tags=web',
    } as HeaderBottomToolbar['location'];
    await element.updateComplete;

    expect(shadowRoot.querySelector('.nav-item a')).toHaveAttribute(
      'href',
      '/schedule/2024-01-01?tags=web',
    );
  });

  it('hides the my-schedule tab when signed out', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Success(days);
    await element.updateComplete;

    const myScheduleTab = shadowRoot.querySelector('.nav-item[data-day="my-schedule"]');
    expect(myScheduleTab).toHaveAttribute('hidden');
    expect(myScheduleTab).toHaveTextContent(mySchedule.title);
  });

  it('renders no tabs on failure', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('.nav-item[data-day="2024-01-01"]')).toHaveLength(0);
  });

  it('positions the selection bar under the selected day tab', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Success(days);
    element.location = {
      params: {},
      pathname: '/schedule/2024-01-01',
      search: '',
    } as HeaderBottomToolbar['location'];
    await element.updateComplete;

    const selected = shadowRoot.querySelector<HTMLElement>('.nav-item.selected');
    const bar = shadowRoot.querySelector<HTMLElement>('.selection-bar');
    expect(selected).toHaveAttribute('data-day', '2024-01-01');
    Object.defineProperty(selected, 'offsetLeft', { value: 10, configurable: true });
    Object.defineProperty(selected, 'offsetWidth', { value: 90, configurable: true });

    // jsdom doesn't compute real layout metrics, so re-invoke the private measurement hook
    // directly after stubbing offsetLeft/offsetWidth to assert the positioning logic itself.
    (element as unknown as { positionSelectionBar(): void }).positionSelectionBar();

    expect(bar?.style.left).toBe('10px');
    expect(bar?.style.width).toBe('90px');
  });
});
