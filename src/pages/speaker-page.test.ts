import { Pending, Success } from '@abraham/remotedata';
import { MockedFunction, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { SpeakerWithTags } from '../models/speaker';
import { router } from '../router';
import { selectSpeaker } from '../store/speakers/selectors';
import { updateImageMetadata } from '../utils/metadata';
import './speaker-page';
import { SpeakerPage } from './speaker-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));
vi.mock('../router', () => ({
  router: { urlForName: vi.fn(), render: vi.fn() },
}));
vi.mock('../store/speakers/selectors', () => ({
  selectSpeaker: vi.fn(),
}));

const speaker: SpeakerWithTags = {
  badges: [{ description: 'GDE', link: 'https://gde.example', name: 'gde' }],
  bio: 'Speaker bio',
  company: 'Example Inc',
  companyLogo: '/logo.png',
  companyLogoUrl: '/logo.png',
  country: 'United States',
  featured: true,
  id: 'speaker-1',
  name: 'Ada Lovelace',
  order: 1,
  photo: '/ada.jpg',
  photoUrl: '/ada.jpg',
  pronouns: 'she/her',
  shortBio: 'Short bio',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  tags: [],
  title: 'Engineer',
};

describe('speaker-page', () => {
  it('defines a component', () => {
    expect(customElements.get('speaker-page')).toBeDefined();
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);

    expect(element.speakers).toBeInstanceOf(Pending);
  });

  it('resolves the speaker from the route and updates metadata', async () => {
    const mockSelectSpeaker = selectSpeaker as MockedFunction<typeof selectSpeaker>;
    const mockUpdateMetadata = vi.mocked(updateImageMetadata);
    mockSelectSpeaker.mockReturnValue(speaker);
    mockUpdateMetadata.mockClear();

    const { element, shadowRoot } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Ada Lovelace');
    expect(shadowRoot).toHaveTextContent('United States • she/her');
    expect(shadowRoot).toHaveTextContent('Engineer, Example Inc');
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'github');
    expect(mockUpdateMetadata).toHaveBeenCalledWith('Ada Lovelace', 'Speaker bio', {
      image: '/ada.jpg',
      imageAlt: 'Ada Lovelace',
    });
  });

  it('redirects to 404 when the speaker cannot be found', async () => {
    const mockSelectSpeaker = selectSpeaker as MockedFunction<typeof selectSpeaker>;
    mockSelectSpeaker.mockReturnValue(undefined);
    vi.mocked(router).render.mockClear();

    const { element } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'missing' } } as never);
    await element.updateComplete;

    expect(router.render).toHaveBeenCalledWith('/404');
  });

  it('renders an empty additional-sessions section when no sessions are supplied', async () => {
    const mockSelectSpeaker = selectSpeaker as MockedFunction<typeof selectSpeaker>;
    mockSelectSpeaker.mockReturnValue(speaker);

    const { element, shadowRoot } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.additional-sections')).toBeNull();
  });

  it('renders additional sessions when the speaker data supplies them', async () => {
    const mockSelectSpeaker = selectSpeaker as MockedFunction<typeof selectSpeaker>;
    const speakerWithSessions = {
      ...speaker,
      sessions: [
        {
          id: 'session-1',
          title: 'A great talk',
          dateReadable: 'Mon, Jan 1',
          startTime: '10:00',
          endTime: '11:00',
          track: { title: 'Track A' },
          tags: ['web'],
        },
      ],
    };
    mockSelectSpeaker.mockReturnValue(speakerWithSessions as SpeakerWithTags);

    const { element, shadowRoot } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.additional-sections')).not.toBeNull();
    expect(shadowRoot).toHaveTextContent('A great talk');
  });
});
