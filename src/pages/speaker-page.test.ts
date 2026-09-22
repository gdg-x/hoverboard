import { Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { SpeakerWithTags } from '../models/speaker';
import { router } from '../router';
import { fetchSpeakers } from '../store/speakers/actions';
import { selectSpeaker } from '../store/speakers/selectors';
import { updateImageMetadata } from '../utils/metadata';
import './speaker-page';
import { SpeakerPage } from './speaker-page';

jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));
jest.mock('../router', () => ({
  router: { urlForName: jest.fn(), render: jest.fn() },
}));
jest.mock('../store/speakers/actions', () => ({
  fetchSpeakers: jest.fn(),
}));
jest.mock('../store/speakers/selectors', () => ({
  selectSpeaker: jest.fn(),
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

  it('dispatches the fetch thunk on connect', async () => {
    const mockFetchSpeakers = fetchSpeakers as jest.MockedFunction<typeof fetchSpeakers>;
    mockFetchSpeakers.mockClear();

    await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);

    expect(mockFetchSpeakers).toHaveBeenCalled();
  });

  it('resolves the speaker from the route and updates metadata', async () => {
    const mockSelectSpeaker = selectSpeaker as jest.MockedFunction<typeof selectSpeaker>;
    const mockUpdateMetadata = jest.mocked(updateImageMetadata);
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
    const mockSelectSpeaker = selectSpeaker as jest.MockedFunction<typeof selectSpeaker>;
    mockSelectSpeaker.mockReturnValue(undefined);
    mocked(router).render.mockClear();

    const { element } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'missing' } } as never);
    await element.updateComplete;

    expect(router.render).toHaveBeenCalledWith('/404');
  });

  it('renders an empty additional-sessions section when no sessions are supplied', async () => {
    const mockSelectSpeaker = selectSpeaker as jest.MockedFunction<typeof selectSpeaker>;
    mockSelectSpeaker.mockReturnValue(speaker);

    const { element, shadowRoot } = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
    element.speakers = new Success([speaker]);
    element.onAfterEnter({ params: { id: 'speaker-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.additional-sections')).toBeNull();
  });

  it('renders additional sessions when the speaker data supplies them', async () => {
    const mockSelectSpeaker = selectSpeaker as jest.MockedFunction<typeof selectSpeaker>;
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
