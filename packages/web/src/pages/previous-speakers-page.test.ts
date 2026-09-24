import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { PreviousSpeaker } from '../models/previous-speaker';
import { router } from '../router';
import { heroSettings, speakers } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './previous-speakers-page';
import { PreviousSpeakersPage } from './previous-speakers-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));
vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
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
    vi.mocked(router).urlForName.mockReturnValue('/previous-speakers/speaker-1');
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

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );

    expect(element.previousSpeakers).toBeInstanceOf(Pending);
  });

  it('updates metadata and renders the completed-state progress visibility', async () => {
    const mockUpdateMetadata = vi.mocked(updateMetadata);
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
