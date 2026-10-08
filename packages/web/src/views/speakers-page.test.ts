import { Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import { FilterGroupKey } from '../models/filter-group';
import type { SpeakerWithTags } from '../models/speaker';
import { updateMetadata } from '../utils/metadata';
import type { SpeakersPage } from './speakers-page';
import './speakers-page';

vi.mock('../utils/metadata');

const speaker = {
  id: 'speaker-1',
  name: 'Ada Lovelace',
  company: 'Example',
  country: 'United States',
  photoUrl: '/ada.jpg',
  socials: [],
  tags: ['Web'],
} as never as SpeakerWithTags;

const render = async (props: Partial<SpeakersPage> = {}) => {
  const result = await fixture<SpeakersPage>(html`<speakers-page></speakers-page>`);
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return result;
};

describe('speakers-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('sets the page metadata and titles the page', async () => {
    const { shadowRoot } = await render();

    expect(updateMetadata).toHaveBeenCalledWith(
      'Speakers',
      expect.stringMatching(/^Hear from the Googlers/),
    );
    expect(shadowRoot.querySelector('simple-hero')).toHaveAttribute('page', 'speakers');
  });

  it('shows every speaker as a card', async () => {
    const { shadowRoot } = await render({ speakersToRender: [speaker] });

    expect(shadowRoot.querySelector('.speakers speaker-card')).toHaveProperty('speaker', speaker);
    expect(shadowRoot.querySelector('filter-menu')).toHaveProperty('resultsCount', 1);
  });

  it('shows progress until the speakers load', async () => {
    const { element, shadowRoot } = await render();

    expect(shadowRoot.querySelector('hb-progress')).not.toHaveAttribute('hidden');

    element.speakers = new Success([speaker]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-progress')).toHaveAttribute('hidden');
  });

  it('offers to clear filters that match nobody', async () => {
    const { shadowRoot } = await render({
      speakersToRender: [],
      selectedFilters: [{ group: FilterGroupKey.tags, tag: 'design' }],
    });

    expect(shadowRoot.querySelector('.empty')).toHaveTextContent(
      'No speakers match these filters.',
    );
    expect(shadowRoot.querySelector('.empty hb-button')).toHaveTextContent('Clear filters');
  });

  it('shows previous speakers only when that feature is on', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('previous-speakers-block')).not.toBeNull();

    litRender(nothing, document.body);
    setFeatures({ previousSpeakers: false });
    const off = await render();

    expect(off.shadowRoot.querySelector('previous-speakers-block')).toBeNull();
  });
});
