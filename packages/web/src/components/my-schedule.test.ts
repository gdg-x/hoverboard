import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Day } from '../models/day';
import { schedule } from '../utils/data';
import type { MySchedule } from './my-schedule';
import './my-schedule';
import type { ScheduleDay } from './schedule-day';

vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
}));

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

describe('my-schedule', () => {
  it('defines a component', () => {
    expect(customElements.get('my-schedule')).toBeDefined();
  });

  it('renders an auth-required prompt with sign-in text', async () => {
    const { shadowRoot } = await fixture<MySchedule>(html`<my-schedule></my-schedule>`);

    const authRequired = shadowRoot.querySelector('auth-required');
    expect(authRequired).toBeInTheDocument();

    const prompt = shadowRoot.querySelector('[slot="prompt"]');
    expect(prompt).toBeInTheDocument();
    expect(prompt).toHaveTextContent(schedule.saveSessionsSignedOut);
  });

  it('renders a schedule-day for every featured day', async () => {
    const { element, shadowRoot } = await fixture<MySchedule>(html`<my-schedule></my-schedule>`);
    element.featuredSchedule = days;
    await element.updateComplete;

    const dates = shadowRoot.querySelectorAll('.date');
    expect(dates).toHaveLength(2);
    expect(dates[0]).toHaveTextContent('January 1');
    expect(dates[1]).toHaveTextContent('January 2');

    const scheduleDays = shadowRoot.querySelectorAll<ScheduleDay>('schedule-day');
    expect(scheduleDays).toHaveLength(2);
    expect(scheduleDays[0]?.day).toEqual(days[0]);
    expect(scheduleDays[0]?.onlyFeatured).toBe(true);
    expect(scheduleDays[0]).toHaveAttribute('name', '2024-01-01');
    expect(scheduleDays[1]?.day).toEqual(days[1]);
  });

  it('renders nothing when there is no featured schedule', async () => {
    const { shadowRoot } = await fixture<MySchedule>(html`<my-schedule></my-schedule>`);

    expect(shadowRoot.querySelectorAll('schedule-day')).toHaveLength(0);
  });
});
