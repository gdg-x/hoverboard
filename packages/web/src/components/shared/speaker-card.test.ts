import { describe, expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Speaker } from '../../models/speaker';
import type { SpeakerCard } from './speaker-card';
import './speaker-card';

const speaker = {
  id: 'ada',
  name: 'Ada Lovelace',
  company: 'Analytical Engines',
  country: 'United Kingdom',
  photoUrl: 'https://example.com/ada.jpg',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  badges: [{ name: 'gde', link: 'https://developers.google.com', description: 'GDE' }],
} as Speaker;

describe('speaker-card', () => {
  it('is one link to the speaker, named by the speaker', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card .speaker=${speaker}></speaker-card>`,
    );

    const card = shadowRoot.querySelector('hb-card')!;
    expect(card).toHaveAttribute('href', '/speakers/ada');
    expect(card).toHaveAttribute('label', 'Ada Lovelace');
    expect(shadowRoot.querySelectorAll('a')).toHaveLength(0);
  });

  it('shows the name, company, country and badges as text', async () => {
    const { shadowRoot, shadowRootForWithin } = await fixture<SpeakerCard>(
      html`<speaker-card .speaker=${speaker}></speaker-card>`,
    );

    expect(
      within(shadowRootForWithin).getByRole('heading', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(shadowRoot.querySelector('.meta')).toHaveTextContent(
      'Analytical Engines · United Kingdom',
    );
    expect(shadowRoot.querySelector('.badges hb-chip')).toHaveTextContent('GDE');
  });

  it('shows the first GDE, GDG, Google or WTM badge on the photo, not a social link', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card
        .speaker=${{
          ...speaker,
          badges: [{ name: 'other', link: '', description: 'Other' }, ...speaker.badges!],
        }}
      ></speaker-card>`,
    );

    const affiliation = shadowRoot.querySelector('.affiliation')!;
    expect(affiliation).toHaveAttribute('aria-hidden', 'true');
    expect(affiliation.querySelector('hoverboard-icon')).toHaveAttribute('name', 'gde');
    expect(affiliation.querySelector<HTMLElement>('hoverboard-icon')!.style.color).toBe(
      'var(--hb-tag-gde, var(--hb-color-outline))',
    );
    expect(shadowRoot.querySelector('.photo')).toHaveAttribute('alt', '');
  });

  it('has no photo badge without an affiliation, whatever links the speaker has', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card .speaker=${{ ...speaker, badges: [] }}></speaker-card>`,
    );

    expect(shadowRoot.querySelector('.affiliation')).toBeNull();
  });

  it('leaves out what the speaker does not have', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card
        .speaker=${{ ...speaker, company: '', country: '', socials: [], badges: [] }}
      ></speaker-card>`,
    );

    expect(shadowRoot.querySelector('.meta')).toBeNull();
    expect(shadowRoot.querySelector('.affiliation')).toBeNull();
    expect(shadowRoot.querySelector('.badges')).toBeNull();
  });

  it('names its photo for the view transition to the speaker page', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card .speaker=${speaker}></speaker-card>`,
    );

    expect(shadowRoot.querySelector<HTMLElement>('.photo')!.style.viewTransitionName).toBe(
      'speaker-ada',
    );
  });

  it('can link elsewhere, with its own transition name', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card
        .speaker=${speaker}
        href="/previous-speakers/ada"
        transition-name="previous-speaker-ada"
      ></speaker-card>`,
    );

    expect(shadowRoot.querySelector('hb-card')).toHaveAttribute('href', '/previous-speakers/ada');
    expect(shadowRoot.querySelector<HTMLElement>('.photo')!.style.viewTransitionName).toBe(
      'previous-speaker-ada',
    );
  });

  it('colors badges with the badge colors', async () => {
    const { shadowRoot } = await fixture<SpeakerCard>(
      html`<speaker-card .speaker=${speaker}></speaker-card>`,
    );

    expect(
      shadowRoot
        .querySelector<HTMLElement>('.badges hb-chip')!
        .style.getPropertyValue('--hb-chip-background'),
    ).toContain('--hb-tag-gde-container');
  });
});
