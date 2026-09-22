import { Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { SpeakerWithTags } from '../models/speaker';
import { router } from '../router';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './speakers-page';
import { SpeakersPage } from './speakers-page';

jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));
jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));

const speaker: SpeakerWithTags = {
  badges: [{ description: 'GDE', link: 'https://gde.example', name: 'gde' }],
  bio: 'Bio',
  company: 'Example',
  companyLogo: '/logo.png',
  companyLogoUrl: '/logo.png',
  country: 'United States',
  featured: true,
  id: 'speaker-1',
  name: 'Ada Lovelace',
  order: 1,
  photo: '/ada.jpg',
  photoUrl: '/ada.jpg',
  shortBio: 'Short bio',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  tags: [],
  title: 'Engineer',
};

describe('speakers-page', () => {
  it('defines a component', () => {
    expect(customElements.get('speakers-page')).toBeDefined();
  });

  it('renders speaker cards with badges and socials', async () => {
    mocked(router).urlForName.mockReturnValue('/speakers/speaker-1');
    const { element, shadowRoot } = await fixture<SpeakersPage>(
      html`<speakers-page></speakers-page>`,
    );
    element.speakersToRender = [speaker];
    await element.updateComplete;

    expect(shadowRoot.querySelector('a.speaker')).toHaveAttribute('href', '/speakers/speaker-1');
    expect(shadowRoot).toHaveTextContent('Ada Lovelace');
    expect(shadowRoot.querySelector('hoverboard-icon.badge-icon')).toHaveAttribute('name', 'gde');
    expect(shadowRoot.querySelector('hoverboard-icon.social-icon')).toHaveAttribute(
      'name',
      'github',
    );
  });

  it('triggers the fetch and starts in the pending state, and updates metadata', async () => {
    const mockUpdateMetadata = jest.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();

    const { element } = await fixture<SpeakersPage>(html`<speakers-page></speakers-page>`);

    expect(element.speakers).toBeInstanceOf(Pending);
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.speakers.title,
      heroSettings.speakers.metaDescription,
    );
  });

  it('shows and hides the loading indicators', async () => {
    const { element, shadowRoot } = await fixture<SpeakersPage>(
      html`<speakers-page></speakers-page>`,
    );

    expect(shadowRoot.querySelector('md-linear-progress')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('content-loader')).not.toHaveAttribute('hidden');

    element.speakers = new Success([speaker]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('md-linear-progress')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('content-loader')).toHaveAttribute('hidden');
  });

  it('passes filter state to the filter-menu', async () => {
    const { element, shadowRoot } = await fixture<SpeakersPage>(
      html`<speakers-page></speakers-page>`,
    );
    element.speakersToRender = [speaker];
    await element.updateComplete;

    expect(shadowRoot.querySelector('filter-menu')).toHaveProperty('resultsCount', 1);
  });
});
