import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { SocialLinks } from '../components/shared/social-links';
import type { SpeakerProfile } from '../components/shared/speaker-profile';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import { updateImageMetadata } from '../utils/metadata';
import { goto } from '../utils/navigation';
import type { PreviousSpeakerPage } from './previous-speaker-page';
import './previous-speaker-page';

vi.mock('../utils/metadata');
vi.mock('../utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/navigation')>()),
  goto: vi.fn(),
}));
vi.mock('../store/previous-speakers/selectors', () => ({ selectPreviousSpeaker: vi.fn() }));

const speaker: PreviousSpeaker = {
  bio: 'Speaker bio',
  company: 'Example Inc',
  country: 'United States',
  id: 'speaker-1',
  name: 'Ada Lovelace',
  order: 1,
  photoUrl: '/ada.jpg',
  sessions: { '2023': [{ tags: [], title: 'An old talk' }] },
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  title: 'Engineer',
};

const render = async () => {
  const result = await fixture<PreviousSpeakerPage>(
    html`<previous-speaker-page></previous-speaker-page>`,
  );
  result.element.speakers = new Success([speaker]);
  result.element.speakerId = 'speaker-1';
  await result.element.updateComplete;
  await result.element.updateComplete;
  return result;
};

describe('previous-speaker-page', () => {
  beforeEach(() => {
    vi.mocked(selectPreviousSpeaker).mockReturnValue(speaker);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('shows the speaker, their talks and other previous speakers', async () => {
    const { shadowRoot } = await render();
    const profile = deepQuerySelector<SpeakerProfile>(shadowRoot, 'hero-block > speaker-profile')!;

    expect(profile.speaker).toBe(speaker);
    expect(profile).toHaveAttribute('kind', 'previous-speaker');
    expect(deepQuerySelector<SocialLinks>(shadowRoot, '.inner > social-links')!.socials).toBe(
      speaker.socials,
    );
    expect(deepQuerySelector(shadowRoot, '.inner > previous-talks')).toHaveProperty(
      'sessions',
      speaker.sessions,
    );
    expect(deepQuerySelector(shadowRoot, 'previous-speakers-block')).not.toBeNull();
    expect(updateImageMetadata).toHaveBeenCalledWith(
      'Ada Lovelace | Previous Speakers',
      'Speaker bio',
      {
        image: '/ada.jpg',
        imageAlt: 'Ada Lovelace',
      },
    );
  });

  it('links back to all previous speakers', async () => {
    await render();

    expect(screen.getByShadowRole('link', { name: 'All previous speakers' })).toHaveAttribute(
      'href',
      '/previous-speakers',
    );
  });

  it('goes to the 404 page for a missing speaker', async () => {
    vi.mocked(selectPreviousSpeaker).mockReturnValue(undefined);
    await render();

    expect(goto).toHaveBeenCalledWith('/404');
  });

  it('has no talks section without talks', async () => {
    vi.mocked(selectPreviousSpeaker).mockReturnValue({ ...speaker, sessions: {} });
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'previous-talks')).toBeNull();
  });
});
