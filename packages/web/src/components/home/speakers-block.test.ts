import { Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SpeakerWithTags } from '../../models/speaker';
import type { SpeakerCard } from '../shared/speaker-card';
import type { SpeakersBlock } from './speakers-block';
import './speakers-block';

const speakers: SpeakerWithTags[] = [
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
    order: 1,
    photo: '',
    photoUrl: 'https://example.com/photo.jpg',
    shortBio: 'Short bio',
    socials: [],
    tags: [],
    title: 'Engineer',
  },
];

describe('speakers-block', () => {
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
});
