import { Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SpeakerWithTags } from '../../models/speaker';
import type { HoverboardIcon } from '../shared/hoverboard-icon';
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

  it('renders featured speakers and routes speaker links', async () => {
    const { element, shadowRootForWithin } = await fixture<SpeakersBlock>(
      html`<speakers-block data-testid="block"></speakers-block>`,
    );
    element.speakers = new Success(speakers);
    await element.updateComplete;
    expect(screen.getByTestId('block')).toBeInTheDocument();
    const speakerLink = within(shadowRootForWithin).getByRole('link', { name: 'Example Speaker' });
    expect(speakerLink).toHaveAttribute('href', '/speakers/speaker-1');
    expect(
      within(shadowRootForWithin).getByRole('heading', { name: 'Example Speaker' }),
    ).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('hoverboard-icon')).toHaveAttribute(
      'name',
      'linkedin',
    );
    await shadowRootForWithin.querySelector<HoverboardIcon>('hoverboard-icon')?.updateComplete;
    expect(
      shadowRootForWithin.querySelector('hoverboard-icon')?.shadowRoot?.querySelector('svg'),
    ).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('md-outlined-button hoverboard-icon')).toHaveAttribute(
      'slot',
      'icon',
    );
  });
});
