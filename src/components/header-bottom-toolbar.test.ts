import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Day } from '../models/day';
import { mySchedule } from '../utils/data';
import type { HeaderBottomToolbar } from './header-bottom-toolbar';

jest.mock('@polymer/app-layout/app-toolbar/app-toolbar', () => ({}));
jest.mock('@polymer/paper-tabs', () => ({}));

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
    expect(shadowRoot.querySelector('paper-tabs')).toHaveAttribute('hidden');
  });

  it('renders a tab for every day', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Success(days);
    await element.updateComplete;

    const tabs = shadowRoot.querySelectorAll('paper-tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('day', '2024-01-01');
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

    expect(shadowRoot.querySelector('paper-tab a')).toHaveAttribute(
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

    const myScheduleTab = shadowRoot.querySelector('paper-tab[day="my-schedule"]');
    expect(myScheduleTab).toHaveAttribute('hidden');
    expect(myScheduleTab).toHaveTextContent(mySchedule.title);
  });

  it('renders no tabs on failure', async () => {
    const { element, shadowRoot } = await fixture<HeaderBottomToolbar>(
      html`<header-bottom-toolbar></header-bottom-toolbar>`,
    );
    element.schedule = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('paper-tab[day="2024-01-01"]')).toHaveLength(0);
  });
});
