import { Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { router } from '../router';
import { SpeakerWithTags } from '../models/speaker';
import type { SpeakersBlock } from './speakers-block';
import './speakers-block';

vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
}));

const mockUrlForName = vi.mocked(router.urlForName);

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
    mockUrlForName.mockReturnValue('/speakers/speaker-1');
    const { element, shadowRootForWithin } = await fixture<SpeakersBlock>(
      html`<speakers-block data-testid="block"></speakers-block>`,
    );
    element.speakers = new Success(speakers);
    await element.updateComplete;
    expect(screen.getByTestId('block')).toBeInTheDocument();
    const speakerLink = shadowRootForWithin.querySelector('a.speaker');
    expect(speakerLink).toHaveTextContent('Example Speaker');
    expect(speakerLink).toHaveAttribute('href', '/speakers/speaker-1');
    expect(shadowRootForWithin.querySelector('hoverboard-icon')).toHaveAttribute(
      'name',
      'linkedin',
    );
    expect(
      shadowRootForWithin.querySelector('hoverboard-icon')?.shadowRoot?.querySelector('svg'),
    ).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('md-outlined-button hoverboard-icon')).toHaveAttribute(
      'slot',
      'icon',
    );
  });
});
