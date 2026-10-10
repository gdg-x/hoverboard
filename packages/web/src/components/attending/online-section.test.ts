import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { store } from '../../store';
import { loadLocalTime } from '../../store/ui';
import type { OnlineSection } from './online-section';
import './online-section';

const config = vi.hoisted(() => ({ stream: 'https://stream.example/live' as string | undefined }));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  timeZone: 'Europe/Kyiv',
  get stream() {
    return config.stream;
  },
}));
vi.mock('../../store/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/ui')>()),
  loadLocalTime: vi.fn(),
}));

const render = async (attendance: 'inPerson' | 'online' | 'hybrid' = 'online') => {
  const result = await fixture<OnlineSection>(html`
    <online-section .attendance=${attendance}
      ><h2 slot="heading">Joining online</h2></online-section
    >
  `);
  await result.element.updateComplete;
  return result;
};

describe('online-section', () => {
  beforeEach(() => {
    config.stream = 'https://stream.example/live';
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
  });

  it('links to the stream after the heading, for online and hybrid events', async () => {
    for (const attendance of ['online', 'hybrid'] as const) {
      const { shadowRoot } = await render(attendance);

      expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
      expect(shadowRoot.querySelector('.watch')).toHaveAttribute(
        'href',
        'https://stream.example/live',
      );
      expect(shadowRoot.querySelector('.watch')).toHaveTextContent('Watch live');
      litRender(nothing, document.body);
    }
  });

  it('renders nothing in person, or without a stream', async () => {
    const inPerson = await render('inPerson');
    expect(inPerson.shadowRoot.querySelector('slot, .watch')).toBeNull();
    litRender(nothing, document.body);

    config.stream = undefined;
    const withoutStream = await render('online');
    expect(withoutStream.shadowRoot.querySelector('slot, .watch')).toBeNull();
  });

  it("says which time zone the site's times are in, once in the browser", async () => {
    const { element, shadowRoot } = await render();

    expect(loadLocalTime).toHaveBeenCalled();
    expect(shadowRoot.querySelector('.time-zone')).toHaveTextContent(
      'Times on this site are in Europe/Kyiv.',
    );

    setStoreState({ ui: { ...store.getState().ui, localTime: true } });
    await element.updateComplete;

    expect(shadowRoot.querySelector('.time-zone')).toHaveTextContent(
      'Times on this site are in your time zone.',
    );
  });
});
