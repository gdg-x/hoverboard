import { Failure, Initialized, Pending } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { PreviousSpeaker } from '../models/previous-speaker';
import { router } from '../router';
import { fetchPreviousSpeakers } from '../store/previous-speakers/actions';
import { loading, previousSpeakersBlock } from '../utils/data';
import type { PreviousSpeakersBlock } from './previous-speakers-block';
import './previous-speakers-block';

jest.mock('../store/previous-speakers/actions', () => ({
  fetchPreviousSpeakers: jest.fn(),
}));

jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));

const mockRouter = mocked(router);
const mockFetchPreviousSpeakers = fetchPreviousSpeakers as jest.MockedFunction<
  typeof fetchPreviousSpeakers
>;

const speaker: PreviousSpeaker = {
  bio: 'Bio',
  company: 'Example',
  country: 'United States',
  id: 'speaker-1',
  name: 'Previous Speaker',
  order: 1,
  photoUrl: 'https://example.com/photo.jpg',
  sessions: {},
  socials: [],
  title: 'Engineer',
};

describe('previous-speakers-block', () => {
  it('defines a component', () => {
    expect(customElements.get('previous-speakers-block')).toBeDefined();
  });

  it('renders the loading state', async () => {
    const { element, shadowRoot } = await fixture<PreviousSpeakersBlock>(
      html`<previous-speakers-block></previous-speakers-block>`,
    );
    element.previousSpeakers = new Pending();
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(loading);
  });

  it('renders the error state', async () => {
    const { element, shadowRoot } = await fixture<PreviousSpeakersBlock>(
      html`<previous-speakers-block></previous-speakers-block>`,
    );
    element.previousSpeakers = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading previous speakers.');
  });

  it('renders speaker links and the CTA icon', async () => {
    mockRouter.urlForName.mockReturnValue('/previous-speakers/speaker-1');
    const { element, shadowRoot } = await fixture<PreviousSpeakersBlock>(
      html`<previous-speakers-block></previous-speakers-block>`,
    );
    element.speakers = [speaker];
    await element.updateComplete;

    const speakerLink = shadowRoot.querySelector('a.speaker');
    expect(speakerLink).toHaveAttribute('href', '/previous-speakers/speaker-1');
    expect(speakerLink?.querySelector('lazy-image')).toHaveAttribute('alt', 'Previous Speaker');
    expect(shadowRoot).toHaveTextContent(previousSpeakersBlock.callToAction.label);
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute(
      'name',
      'arrow-right-circle',
    );
  });

  it('dispatches the previous speakers fetch thunk from the initialized state', async () => {
    mockFetchPreviousSpeakers.mockClear();
    const { element } = await fixture<PreviousSpeakersBlock>(
      html`<previous-speakers-block></previous-speakers-block>`,
    );

    expect(element.previousSpeakers).toBeInstanceOf(Initialized);
    expect(mockFetchPreviousSpeakers).toHaveBeenCalled();
  });
});
