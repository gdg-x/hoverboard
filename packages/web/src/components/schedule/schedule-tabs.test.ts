import { Failure, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import type { Day } from '../../models/day';
import type { RouteLocation } from '../../utils/navigation';
import type { ScheduleTabs } from './schedule-tabs';
import './schedule-tabs';

const days: Day[] = [
  { date: '2024-01-01', tracks: [], timeslots: [] },
  { date: '2024-01-02', tracks: [], timeslots: [] },
];

const location = (pathname: string, search = ''): RouteLocation => ({
  pathname,
  search,
  params: { id: pathname.split('/')[2] },
});

const render = async (props: Partial<ScheduleTabs>) => {
  const result = await fixture<ScheduleTabs>(html`<schedule-tabs></schedule-tabs>`);
  Object.assign(result.element, { schedule: new Success(days), ...props });
  await result.element.updateComplete;
  return within(result.shadowRootForWithin);
};

describe('schedule-tabs', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('links to every day and My Schedule', async () => {
    const view = await render({});
    const links = within(view.getByRole('navigation', { name: 'Schedule days' })).getAllByRole(
      'link',
    );

    expect(links.map((link) => link.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Day 1 January 1',
      'Day 2 January 2',
      'My Schedule',
    ]);
    expect(links[1]).toHaveAttribute('href', '/schedule/2024-01-02');
    expect(links[2]).toHaveAttribute('href', '/schedule/my-schedule');
  });

  it('shows only the date for a one-day event', async () => {
    const view = await render({ schedule: new Success([days[0]!]) });

    expect(view.getAllByRole('link')[0]).toHaveTextContent(/^\s*January 1\s*$/);
  });

  it('marks the first day as current on /schedule', async () => {
    const view = await render({ location: location('/schedule') });

    expect(view.getByRole('link', { current: 'page' })).toHaveTextContent('January 1');
  });

  it("marks the location's day or My Schedule as current", async () => {
    expect(
      (await render({ location: location('/schedule/2024-01-02') })).getByRole('link', {
        current: 'page',
      }),
    ).toHaveTextContent('January 2');
    litRender(nothing, document.body);

    expect(
      (await render({ location: location('/schedule/my-schedule') })).getByRole('link', {
        current: 'page',
      }),
    ).toHaveTextContent('My Schedule');
  });

  it('keeps the query string in its links', async () => {
    const view = await render({ location: location('/schedule/2024-01-01', '?tags=web') });

    expect(view.getAllByRole('link')[0]).toHaveAttribute('href', '/schedule/2024-01-01?tags=web');
  });

  it('leaves out My Schedule when that feature is off', async () => {
    setFeatures({ mySchedule: false });
    await render({});

    expect(screen.queryByText('My Schedule')).toBeNull();
  });

  it('shows no days when the schedule failed', async () => {
    const view = await render({ schedule: new Failure(new Error('failed')) });

    expect(view.queryByText('January 1')).toBeNull();
  });
});
