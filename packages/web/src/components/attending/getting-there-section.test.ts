import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { GettingThereSection } from './getting-there-section';
import './getting-there-section';

const config = vi.hoisted(() => ({
  gettingThere: [] as { mode: string; title?: string; text: string }[],
}));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendingPage() {
    return { gettingThere: config.gettingThere };
  },
}));

const render = async () => {
  const result = await fixture<GettingThereSection>(html`
    <getting-there-section><h2 slot="heading">Getting there</h2></getting-there-section>
  `);
  await result.element.updateComplete;
  return result;
};

const items = (root: ShadowRoot) =>
  [...root.querySelectorAll('.item')].map((item) => [
    item.querySelector('hoverboard-icon')?.getAttribute('name'),
    item.querySelector('h3')?.textContent?.trim(),
    item.querySelector('.text')?.textContent?.trim(),
  ]);

describe('getting-there-section', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    config.gettingThere = [];
  });

  it('renders nothing without ways to get there', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot, .items')).toBeNull();
  });

  it('shows each way in order, with its icon and heading, or the title that replaces it', async () => {
    config.gettingThere = [
      { mode: 'train', text: 'Tram 6 from the station.' },
      { mode: 'plane', text: 'Bus 48.' },
      { mode: 'metro', title: 'By metro line 1', text: 'Get off at Expo.' },
      { mode: 'walk', text: 'Ten minutes from the center.' },
      { mode: 'other', title: 'By rocket', text: 'Land on the roof.' },
    ];
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
    expect(items(shadowRoot)).toEqual([
      ['train', 'By train', 'Tram 6 from the station.'],
      ['flight', 'By plane', 'Bus 48.'],
      ['subway', 'By metro line 1', 'Get off at Expo.'],
      ['walk', 'On foot', 'Ten minutes from the center.'],
      ['directions', 'By rocket', 'Land on the roof.'],
    ]);
  });

  it('renders markdown, without links that could run code', async () => {
    config.gettingThere = [
      {
        mode: 'bus',
        text: 'See the [timetable](https://bus.example/) or [this](javascript:alert(1)).',
      },
    ];
    const { shadowRoot } = await render();

    const links = [...shadowRoot.querySelectorAll('.text a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['https://bus.example/', null]);
  });
});
