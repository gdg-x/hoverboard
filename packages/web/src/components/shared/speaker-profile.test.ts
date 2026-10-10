import { afterEach, describe, expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { ProfileSpeaker, SpeakerProfile } from './speaker-profile';
import './speaker-profile';

const speaker: ProfileSpeaker = {
  id: 'speaker-1',
  name: 'Ada Lovelace',
  photoUrl: '/ada.jpg',
  title: 'Engineer',
  company: 'Example Inc',
  country: 'United States',
  pronouns: 'she/her',
  badges: [{ description: 'Google Developer Expert', link: 'https://gde.example', name: 'gde' }],
};

const render = async (props: Partial<SpeakerProfile>) => {
  const result = await fixture<SpeakerProfile>(html`<speaker-profile></speaker-profile>`);
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('speaker-profile', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it("titles the page with the speaker's name, job, country and pronouns", async () => {
    const { shadowRoot, view } = await render({ speaker });

    expect(view.getByRole('heading', { level: 1 })).toHaveTextContent('Ada Lovelace');
    expect(shadowRoot.querySelector('.details')).toHaveTextContent(
      'Engineer, Example Inc · United States · she/her',
    );
  });

  it('links their badges', async () => {
    const { view } = await render({ speaker });
    const badge = within(view.getByRole('list', { name: 'Badges' })).getByRole('listitem');

    expect(badge.querySelector('hb-chip')).toHaveTextContent('Google Developer Expert');
    expect(badge.querySelector('hb-chip')).toHaveAttribute('href', 'https://gde.example');
  });

  it('names the photo like the card it came from', async () => {
    const { element, shadowRoot } = await render({ speaker });
    const photo = shadowRoot.querySelector<HTMLElement>('speaker-photo')!;

    expect(photo).toHaveAttribute('size', 'l');
    expect(photo).toHaveAttribute('loading', 'eager');
    expect(photo.style.viewTransitionName).toBe('speaker-speaker-1');

    element.kind = 'previous-speaker';
    await element.updateComplete;

    expect(photo.style.viewTransitionName).toBe('previous-speaker-speaker-1');
  });

  it('leaves out what a previous speaker does not have', async () => {
    const { pronouns: _pronouns, badges: _badges, ...previousSpeaker } = speaker;
    const { shadowRoot } = await render({ speaker: previousSpeaker });

    expect(shadowRoot.querySelector('.details')).toHaveTextContent(
      'Engineer, Example Inc · United States',
    );
    expect(shadowRoot.querySelector('.badges')).toBeNull();
  });

  it('holds the place of the heading until the speaker loads', async () => {
    const { shadowRoot } = await render({});

    expect(shadowRoot.querySelector('h1')).toHaveTextContent('');
    expect(shadowRoot.querySelector('speaker-photo')).toBeNull();
    expect(shadowRoot.querySelector('.details')).toBeNull();
  });
});
