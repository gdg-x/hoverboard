import { Failure, Pending, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { PreviousSpeaker } from '../models/previous-speaker';
import { updateMetadata } from '../utils/metadata';
import type { SpeakerCard } from '../components/shared/speaker-card';
import { type PreviousSpeakersPage, speakersByYear } from './previous-speakers-page';
import './previous-speakers-page';

vi.mock('../utils/metadata');

const speaker = (id: string, years: number[]): PreviousSpeaker => ({
  bio: 'Bio',
  company: 'Example',
  country: 'United States',
  id,
  name: id,
  order: 1,
  photoUrl: `/${id}.jpg`,
  sessions: Object.fromEntries(years.map((year) => [year, [{ title: 'Talk', tags: [] }]])),
  socials: [],
  title: 'Engineer',
});

const ada = speaker('ada', [2023, 2024]);
const grace = speaker('grace', [2023]);

const render = async (previousSpeakers: PreviousSpeaker[]) => {
  const result = await fixture<PreviousSpeakersPage>(
    html`<previous-speakers-page></previous-speakers-page>`,
  );
  result.element.previousSpeakers = new Success(previousSpeakers);
  await result.element.updateComplete;
  return result;
};

describe('previous-speakers-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('groups speakers by year, newest first', () => {
    expect(
      speakersByYear([ada, grace]).map(
        ({ year, speakers }) => `${year}: ${speakers.map(({ id }) => id).join(', ')}`,
      ),
    ).toEqual(['2024: ada', '2023: ada, grace']);
  });

  it('shows each year as a heading over its speaker cards', async () => {
    const { shadowRoot } = await render([ada, grace]);
    const years = [...shadowRoot.querySelectorAll('h2.year')].map((year) => year.textContent);

    expect(years).toEqual(['2024', '2023']);
    const cards = shadowRoot.querySelectorAll<SpeakerCard>('section:last-of-type speaker-card');
    expect(cards).toHaveLength(2);
    expect(cards[1]).toHaveAttribute('href', '/previous-speakers/grace');
  });

  it('names each photo for the view transition only once', async () => {
    const { shadowRoot } = await render([ada, grace]);
    const names = [...shadowRoot.querySelectorAll('speaker-card')].map((card) =>
      card.getAttribute('transition-name'),
    );

    expect(names).toEqual(['previous-speaker-ada', 'none', 'previous-speaker-grace']);
  });

  it('sets the page metadata, and shows progress only while loading', async () => {
    const { element, shadowRoot } = await render([]);

    expect(updateMetadata).toHaveBeenCalledWith(
      'Previous Speakers',
      'Check who was with us last years',
    );
    element.previousSpeakers = new Pending();
    await element.updateComplete;
    expect(shadowRoot.querySelector('hb-progress')).not.toHaveAttribute('hidden');

    element.previousSpeakers = new Failure(new Error('failed'));
    await element.updateComplete;
    expect(shadowRoot.querySelector('hb-progress')).toHaveAttribute('hidden');
  });
});
