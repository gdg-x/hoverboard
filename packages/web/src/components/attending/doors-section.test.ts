import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { DoorsSection } from './doors-section';
import './doors-section';

const config = vi.hoisted(() => ({
  doors: [] as { day: string; open: string; close: string; note?: string }[],
}));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  timeZone: 'America/New_York',
  get attendingPage() {
    return { doors: config.doors };
  },
}));

const render = async () => {
  const result = await fixture<DoorsSection>(html`
    <doors-section><h2 slot="heading">Doors</h2></doors-section>
  `);
  await result.element.updateComplete;
  return result;
};

describe('doors-section', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    config.doors = [];
  });

  it('renders nothing without days', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot, .days')).toBeNull();
  });

  it("shows each day's hours at the venue's time, with its note", async () => {
    config.doors = [
      {
        day: '2017-10-13',
        open: '08:00',
        close: '20:00',
        note: 'Registration at the **main** entrance.',
      },
      { day: '2017-10-14', open: '08:30', close: '19:00' },
    ];
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
    expect(
      [...shadowRoot.querySelectorAll('.day')].map((day) => [
        day.querySelector('h3')?.textContent?.trim(),
        day.querySelector('.hours')?.textContent?.trim().replaceAll(/\s+/g, ' '),
        day.querySelector('.text')?.textContent?.trim(),
      ]),
    ).toEqual([
      ['Friday, October 13', '8:00 AM – 8:00 PM', 'Registration at the main entrance.'],
      ['Saturday, October 14', '8:30 AM – 7:00 PM', undefined],
    ]);
    expect(shadowRoot.querySelector('.time-zone')).toHaveTextContent(
      'Times are at the venue, in America/New York.',
    );
  });
});
