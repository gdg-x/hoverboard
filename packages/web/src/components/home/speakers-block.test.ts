import { Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Speaker } from '../../models/speaker';
import { randomOrder } from '../../utils/arrays';
import type { SpeakerCard } from '../shared/speaker-card';
import type { SpeakersBlock } from './speakers-block';
import './speakers-block';

vi.mock('../../utils/arrays', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/arrays')>();
  return { ...actual, randomOrder: vi.fn(actual.randomOrder) };
});

const speakers: Speaker[] = [
  {
    id: 'speaker-1',
    badges: [{ name: 'LinkedIn', link: 'https://linkedin.com/example', description: 'LinkedIn' }],
    bio: 'Speaker bio',
    company: 'Example',
    companyLogo: '',
    companyLogoUrl: 'https://example.com/logo.svg',
    country: 'United States',
    featured: true,
    name: 'Example Speaker',
    photo: '',
    photoUrl: 'https://example.com/photo.jpg',
    shortBio: 'Short bio',
    socials: [],
    title: 'Engineer',
  },
];

const cardIds = (shadowRoot: ShadowRoot) =>
  [...shadowRoot.querySelectorAll<SpeakerCard>('speaker-card')].map(({ speaker }) => speaker.id);

describe('speakers-block', () => {
  afterEach(() => {
    vi.mocked(randomOrder).mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('speakers-block')).toBeDefined();
  });

  it('renders up to four featured speakers as cards', async () => {
    const { element, shadowRoot } = await fixture<SpeakersBlock>(
      html`<speakers-block></speakers-block>`,
    );
    const others = Array.from({ length: 5 }, (_, index) => ({
      ...speakers[0]!,
      id: `featured-${index}`,
    }));
    element.speakers = new Success([
      ...others,
      { ...speakers[0]!, id: 'not-featured', featured: false },
    ]);
    await element.updateComplete;

    const cards = [...shadowRoot.querySelectorAll<SpeakerCard>('speaker-card')];
    expect(cards).toHaveLength(4);
    expect(cards.map(({ speaker }) => speaker.id)).not.toContain('not-featured');
    expect(shadowRoot.querySelector('.cta-button')).toHaveAttribute('href', '/speakers');
  });

  it('shows any speakers when none is featured', async () => {
    const { element, shadowRoot } = await fixture<SpeakersBlock>(
      html`<speakers-block></speakers-block>`,
    );
    element.speakers = new Success([{ ...speakers[0]!, featured: false }]);
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('speaker-card')).toHaveLength(1);
  });

  it('shuffles featured speakers without an order, after the first render', async () => {
    const { element } = await fixture<SpeakersBlock>(html`<speakers-block></speakers-block>`);
    element.speakers = new Success([speakers[0]!, { ...speakers[0]!, id: 'other' }]);
    await element.updateComplete;

    expect(randomOrder).toHaveBeenCalled();
  });

  it('shows featured speakers with an order first, in that order, without shuffling', async () => {
    const { element, shadowRoot } = await fixture<SpeakersBlock>(
      html`<speakers-block></speakers-block>`,
    );
    element.speakers = new Success([
      { ...speakers[0]!, id: 'unordered' },
      { ...speakers[0]!, id: 'second', order: 2 },
      { ...speakers[0]!, id: 'first', order: 0 },
      { ...speakers[0]!, id: 'not-featured', featured: false, order: 1 },
    ]);
    await element.updateComplete;

    expect(cardIds(shadowRoot)).toEqual(['first', 'second', 'unordered']);
    expect(randomOrder).not.toHaveBeenCalled();
  });
});
