import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { SocialLinks } from '../components/shared/social-links';
import type { SpeakerProfile } from '../components/shared/speaker-profile';
import type { BuiltSpeaker } from '../schedule/build-schedule';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import { selectSpeaker } from '../store/speakers/selectors';
import { updateImageMetadata } from '../utils/metadata';
import { goto } from '../utils/navigation';
import type { SpeakerPage } from './speaker-page';
import './speaker-page';

vi.mock('../utils/metadata');
vi.mock('../utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/navigation')>()),
  goto: vi.fn(),
}));
vi.mock('../store/speakers/selectors', () => ({ selectSpeaker: vi.fn() }));
vi.mock('../store/previous-speakers/selectors', () => ({ selectPreviousSpeaker: vi.fn() }));

const speaker: BuiltSpeaker = {
  badges: [{ description: 'Google Developer Expert', link: 'https://gde.example', name: 'gde' }],
  bio: 'Speaker bio',
  company: 'Example Inc',
  companyLogo: '/logo.png',
  companyLogoUrl: '/logo.png',
  country: 'United States',
  featured: true,
  id: 'speaker-1',
  name: 'Ada Lovelace',
  order: 1,
  photo: '/ada.jpg',
  photoUrl: '/ada.jpg',
  pronouns: 'she/her',
  shortBio: 'Short bio',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  sessions: [],
  tags: [],
  title: 'Engineer',
};

const render = async () => {
  const result = await fixture<SpeakerPage>(html`<speaker-page></speaker-page>`);
  result.element.speakers = new Success([speaker]);
  result.element.speakerId = 'speaker-1';
  await result.element.updateComplete;
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('speaker-page', () => {
  beforeEach(() => {
    vi.mocked(selectSpeaker).mockReturnValue(speaker);
    vi.mocked(selectPreviousSpeaker).mockReturnValue(undefined);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it("shows the speaker's profile and sets the metadata", async () => {
    const { shadowRoot } = await render();
    const profile = shadowRoot.querySelector<SpeakerProfile>('speaker-profile')!;

    expect(profile.speaker).toBe(speaker);
    expect(profile).toHaveAttribute('kind', 'speaker');
    expect(updateImageMetadata).toHaveBeenCalledWith('Ada Lovelace', 'Speaker bio', {
      image: '/ada.jpg',
      imageAlt: 'Ada Lovelace',
    });
  });

  it('links back to all speakers and to their social networks', async () => {
    const { shadowRoot, view } = await render();

    expect(view.getByRole('link', { name: 'All speakers' })).toHaveAttribute('href', '/speakers');
    const socials = shadowRoot.querySelector<SocialLinks>('social-links')!;
    expect(socials.socials).toEqual([
      { icon: 'github', link: 'https://github.com/ada', name: 'GitHub' },
    ]);
    expect(socials).toHaveAttribute('label', 'Social links');
    expect(socials).toHaveAttribute('variant', 'tonal');
  });

  it('goes to the 404 page for a missing speaker', async () => {
    vi.mocked(selectSpeaker).mockReturnValue(undefined);
    await render();

    expect(goto).toHaveBeenCalledWith('/404');
  });

  it('shows their sessions as session cards', async () => {
    vi.mocked(selectSpeaker).mockReturnValue({
      ...speaker,
      sessions: [
        {
          id: 'session-1',
          title: 'A great talk',
          description: '',
          mainTag: 'General',
          speakers: [],
        },
      ],
    });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('session-card')).toHaveProperty(
      'session',
      expect.objectContaining({ id: 'session-1' }),
    );
  });

  it('has no sessions section without sessions', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('session-card')).toBeNull();
    expect(shadowRoot.querySelector('.section-title')).toBeNull();
  });

  it('shows their talks in earlier years', async () => {
    const sessions = { 2019: [{ title: 'Old talk', tags: [] }] };
    vi.mocked(selectPreviousSpeaker).mockReturnValue({ sessions } as never as PreviousSpeaker);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('previous-talks')).toHaveProperty('sessions', sessions);
  });

  it('leaves out earlier talks when previous speakers are off', async () => {
    setFeatures({ previousSpeakers: false });
    vi.mocked(selectPreviousSpeaker).mockReturnValue({
      sessions: { 2019: [{ title: 'Old talk', tags: [] }] },
    } as never as PreviousSpeaker);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('previous-talks')).toBeNull();
  });
});
