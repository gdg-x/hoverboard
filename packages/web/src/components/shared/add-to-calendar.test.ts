import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { url } from '../../config/site';
import type { Session } from '../../models/session';
import * as calendar from '../../utils/calendar';
import './add-to-calendar';
import { AddToCalendar } from './add-to-calendar';

const session: Session & { endTime: string } = {
  id: 'session-1',
  title: 'A great talk',
  description: 'Session description',
  day: '2024-01-02',
  startTime: '10:00',
  endTime: '10:45',
};

describe('add-to-calendar', () => {
  it('should be registered', () => {
    expect(customElements.get('add-to-calendar')).toBeDefined();
  });

  it('renders nothing when the session has no schedule times', async () => {
    const { element, shadowRoot } = await fixture<AddToCalendar>(
      html`<add-to-calendar></add-to-calendar>`,
    );
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-menu')).toBeNull();
  });

  it('links to Google Calendar and downloads an ics for Apple Calendar', async () => {
    const download = vi.spyOn(calendar, 'downloadIcs').mockImplementation(() => undefined);
    const { element, shadowRoot } = await fixture<AddToCalendar>(
      html`<add-to-calendar .session="${session}"></add-to-calendar>`,
    );
    await element.updateComplete;

    const [google, apple] = Array.from(
      shadowRoot.querySelectorAll<HTMLElement>('hb-menu [role="menuitem"]'),
    );
    expect(google).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
    expect(google).toHaveAttribute('rel', 'noopener noreferrer');

    apple!.click();

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'A great talk' }),
      'session-1',
    );
  });

  it("links the event to the session's page on the site", async () => {
    const download = vi.spyOn(calendar, 'downloadIcs').mockImplementation(() => undefined);
    const { shadowRoot } = await fixture<AddToCalendar>(
      html`<add-to-calendar .session="${session}"></add-to-calendar>`,
    );

    shadowRoot.querySelectorAll<HTMLElement>('[role="menuitem"]')[1]!.click();

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        description: `Session description\n\n${url}sessions/session-1`,
      }),
      'session-1',
    );
  });
});
