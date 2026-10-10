import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { BuiltDay } from '../../schedule/build-schedule';
import type { MySchedule } from './my-schedule';
import './my-schedule';

const day = (date: string, items: unknown[] = []): BuiltDay => ({
  date,
  tracks: [{ id: 'track-1', title: 'Track 1' }],
  timeslots: [
    {
      startTime: '10:00',
      endTime: '11:00',
      sessions: [{ gridArea: '1 / 1 / 2 / 2', items } as never],
    },
  ],
  tags: [],
});

const render = async (featuredSchedule: BuiltDay[]) => {
  const result = await fixture<MySchedule>(html`<my-schedule></my-schedule>`);
  result.element.featuredSchedule = featuredSchedule;
  await result.element.updateComplete;
  return result;
};

describe('my-schedule', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('asks signed-out visitors to sign in', async () => {
    const { shadowRoot } = await render([]);

    expect(shadowRoot.querySelector('[slot="prompt"]')).toHaveTextContent(
      'Sign in to save sessions',
    );
  });

  it('shows each day under its own heading, with only saved sessions', async () => {
    const days = [day('2024-01-01', [{ id: 's1', title: 'One' }]), day('2024-01-02')];
    const { shadowRoot } = await render(days);

    const headings = shadowRoot.querySelectorAll('h2.date');
    expect([...headings].map((heading) => heading.textContent)).toEqual(['January 1', 'January 2']);
    const scheduleDays = shadowRoot.querySelectorAll('schedule-day');
    expect(scheduleDays[0]!.day).toBe(days[0]);
    expect(scheduleDays[0]!.onlyFeatured).toBe(true);
    expect(shadowRoot.querySelector('.hint')).toBeNull();
  });

  it('explains how to add sessions when none are saved', async () => {
    const { shadowRoot } = await render([day('2024-01-01')]);

    expect(shadowRoot.querySelector('.hint')).toHaveTextContent(
      'Save sessions in the schedule to see them here.',
    );
    expect(shadowRoot.querySelector('.empty .illustration')).toHaveAttribute('aria-hidden', 'true');
  });
});
