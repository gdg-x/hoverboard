import { Failure, Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { PreviousSpeaker } from '../models/previous-speaker';
import { router } from '../router';
import { fetchPreviousSpeakers } from '../store/previous-speakers/actions';
import { heroSettings, speakers } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './previous-speakers-page';
import { PreviousSpeakersPage } from './previous-speakers-page';

jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));
jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));
jest.mock('../store/previous-speakers/actions', () => ({
  fetchPreviousSpeakers: jest.fn(),
}));

const speaker: PreviousSpeaker = {
  bio: 'Bio',
  company: 'Example',
  country: 'United States',
  id: 'speaker-1',
  name: 'Previous Speaker',
  order: 1,
  photoUrl: '/speaker.jpg',
  sessions: { 2024: [] },
  socials: [],
  title: 'Engineer',
};

describe('previous-speakers-page', () => {
  it('defines a component', () => {
    expect(customElements.get('previous-speakers-page')).toBeDefined();
  });

  it('renders speaker links and years', async () => {
    mocked(router).urlForName.mockReturnValue('/previous-speakers/speaker-1');
    const { element, shadowRoot } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );
    element.previousSpeakers = new Success([speaker]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('a.speaker')).toHaveAttribute(
      'href',
      '/previous-speakers/speaker-1',
    );
    expect(shadowRoot).toHaveTextContent('Previous Speaker');
    expect(shadowRoot).toHaveTextContent('2024');
  });

  it('dispatches the fetch thunk from the initialized state', async () => {
    const mockFetchPreviousSpeakers = fetchPreviousSpeakers as jest.MockedFunction<
      typeof fetchPreviousSpeakers
    >;
    mockFetchPreviousSpeakers.mockClear();
    const { element } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );

    expect(element.previousSpeakers).toBeInstanceOf(Initialized);
    expect(mockFetchPreviousSpeakers).toHaveBeenCalled();
  });

  it('updates metadata and renders the completed-state progress visibility', async () => {
    const mockUpdateMetadata = jest.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();
    const { element, shadowRoot } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );
    element.previousSpeakers = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.previousSpeakers.title,
      heroSettings.previousSpeakers.metaDescription,
    );
    expect(shadowRoot.querySelector('md-linear-progress')).toHaveAttribute('hidden');
    expect(speakers.previousYears).toBeDefined();
  });
});
