import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { PreviousSpeaker } from '../models/previous-speaker';
import { updateMetadata } from '../utils/metadata';
import './previous-speakers-page';
import { PreviousSpeakersPage } from './previous-speakers-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
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

  it('renders the company logo with the company name as alt text', async () => {
    const { element, shadowRoot } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );
    element.previousSpeakers = new Success([{ ...speaker, companyLogo: '/logo.svg' }]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.company-logo')).toHaveAttribute('alt', 'Example');
  });

  it('does not render a company logo image without a source', async () => {
    const { element, shadowRoot } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );
    element.previousSpeakers = new Success([speaker]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.company-logo')).toBeNull();
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
      'Previous Speakers',
      'Check who was with us last years',
    );
    expect(shadowRoot.querySelector('hb-progress')).toHaveAttribute('hidden');
  });

  it('labels one year or several years', async () => {
    const { element, shadowRoot } = await fixture<PreviousSpeakersPage>(
      html`<previous-speakers-page></previous-speakers-page>`,
    );
    element.previousSpeakers = new Success([speaker]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Year: 2024');

    element.previousSpeakers = new Success([{ ...speaker, sessions: { 2023: [], 2024: [] } }]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Years: 2024, 2023');
  });
});
