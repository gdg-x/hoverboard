import { Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Day } from '../models/day';
import { mySchedule } from '../utils/data';
import type { ScheduleDay } from './schedule-day';
import './schedule-day';
import type { SessionElement } from './session-element';
import './session-element';

jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));

const day: Day = {
  date: '2024-01-01',
  dateReadable: 'January 1',
  tracks: [{ title: 'Track 1' }],
  timeslots: [
    {
      startTime: '10:00',
      endTime: '11:00',
      sessions: [
        {
          items: [
            {
              id: 'session-1',
              title: 'Session One',
              description: 'Description',
            },
          ],
        } as never,
      ],
    },
    {
      startTime: '11:00',
      endTime: '12:00',
      sessions: [{ items: [] } as never],
    },
  ],
};

describe('schedule-day', () => {
  it('defines a component', () => {
    expect(customElements.get('schedule-day')).toBeDefined();
  });

  it('renders timeslots and sessions for the day', async () => {
    const { element, shadowRoot } = await fixture<ScheduleDay>(html`<schedule-day></schedule-day>`);
    element.schedule = new Success([day]);
    element.day = day;
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('.start-time')).toHaveLength(2);
    expect(shadowRoot.querySelectorAll('session-element')).toHaveLength(1);
    expect(
      (shadowRoot.querySelector('session-element') as SessionElement | null)?.session?.id,
    ).toBe('session-1');
  });

  it('shows the add-session CTA for empty timeslots when only showing featured sessions', async () => {
    const { element, shadowRoot } = await fixture<ScheduleDay>(html`<schedule-day></schedule-day>`);
    element.day = day;
    element.onlyFeatured = true;
    await element.updateComplete;

    const addSessionLinks = shadowRoot.querySelectorAll('.add-session');
    expect(addSessionLinks[0]).toHaveAttribute('hidden');
    expect(addSessionLinks[1]).not.toHaveAttribute('hidden');
    expect(addSessionLinks[1]).toHaveTextContent(mySchedule.browseSession);
    expect(addSessionLinks[1]?.querySelector('hoverboard-icon')).toHaveAttribute(
      'name',
      'add-circle-outline',
    );
  });

  it('hides the add-session CTA when not filtering to featured sessions', async () => {
    const { element, shadowRoot } = await fixture<ScheduleDay>(html`<schedule-day></schedule-day>`);
    element.day = day;
    await element.updateComplete;

    shadowRoot.querySelectorAll('.add-session').forEach((link) => {
      expect(link).toHaveAttribute('hidden');
    });
  });
});
