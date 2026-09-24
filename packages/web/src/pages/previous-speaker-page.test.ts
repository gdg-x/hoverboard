import { Pending, Success } from '@abraham/remotedata';
import { MockedFunction, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { PreviousSpeaker } from '../models/previous-speaker';
import { router } from '../router';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import { updateImageMetadata } from '../utils/metadata';
import './previous-speaker-page';
import { PreviousSpeakerPage } from './previous-speaker-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));
vi.mock('../router', () => ({
  router: { urlForName: vi.fn(), render: vi.fn() },
}));
vi.mock('../store/previous-speakers/selectors', () => ({
  selectPreviousSpeaker: vi.fn(),
  selectRandomPreviousSpeakers: vi.fn().mockReturnValue([]),
}));

const speaker: PreviousSpeaker = {
  bio: 'Speaker bio',
  company: 'Example Inc',
  country: 'United States',
  id: 'speaker-1',
  name: 'Ada Lovelace',
  order: 1,
  photoUrl: '/ada.jpg',
  sessions: {
    '2023': [{ tags: [], title: 'An old talk' }],
  },
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  title: 'Engineer',
};

describe('previous-speaker-page', () => {
  it('defines a component', () => {
    expect(customElements.get('previous-speaker-page')).toBeDefined();
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<PreviousSpeakerPage>(
      html`<previous-speaker-page></previous-speaker-page>`,
    );

    expect(element.speakers).toBeInstanceOf(Pending);
  });

  it('resolves the speaker from the route and updates metadata', async () => {
    const mockSelectPreviousSpeaker = selectPreviousSpeaker as MockedFunction<
      typeof selectPreviousSpeaker
    >;
    const mockUpdateMetadata = vi.mocked(updateImageMetadata);
    mockSelectPreviousSpeaker.mockReturnValue(speaker);
    mockUpdateMetadata.mockClear();

    const { element, shadowRoot } = await fixture<PreviousSpeakerPage>(
      html`<previous-speaker-page></previous-speaker-page>`,
    );
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Engineer, Example Inc');
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'github');
    expect(shadowRoot).toHaveTextContent('An old talk');
    expect(mockUpdateMetadata).toHaveBeenCalledWith('Ada Lovelace', 'Speaker bio', {
      image: '/ada.jpg',
      imageAlt: 'Ada Lovelace',
    });
  });

  it('redirects to 404 when the speaker cannot be found', async () => {
    const mockSelectPreviousSpeaker = selectPreviousSpeaker as MockedFunction<
      typeof selectPreviousSpeaker
    >;
    mockSelectPreviousSpeaker.mockReturnValue(undefined);
    vi.mocked(router).render.mockClear();

    const { element } = await fixture<PreviousSpeakerPage>(
      html`<previous-speaker-page></previous-speaker-page>`,
    );
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'missing' } } as never);
    await element.updateComplete;

    expect(router.render).toHaveBeenCalledWith('/404');
  });

  it('renders an empty additional-sessions section when the speaker has no sessions', async () => {
    const mockSelectPreviousSpeaker = selectPreviousSpeaker as MockedFunction<
      typeof selectPreviousSpeaker
    >;
    mockSelectPreviousSpeaker.mockReturnValue({ ...speaker, sessions: {} });

    const { element, shadowRoot } = await fixture<PreviousSpeakerPage>(
      html`<previous-speaker-page></previous-speaker-page>`,
    );
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.additional-sections')).toBeNull();
  });
});
