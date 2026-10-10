import { Failure, Pending, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { aboutOrganizerBlock, team } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import type { SocialLinks } from '../components/shared/social-links';
import type { TeamPage } from './team-page';
import './team-page';

vi.mock('../utils/metadata');

const member = {
  id: 'member-1',
  name: 'Ada Lovelace',
  order: 1,
  parentId: 'team-1',
  photo: '/ada.jpg',
  photoUrl: '/ada.jpg',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  title: 'Organizer',
};

const render = async () => {
  const result = await fixture<TeamPage>(html`<team-page></team-page>`);
  result.element.teamsMembers = new Success([
    { id: 'team-1', title: 'Core team', members: [member] },
  ]);
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('team-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('opens with the team photo and story', async () => {
    const { shadowRoot } = await render();

    expect(updateMetadata).toHaveBeenCalledWith('Team', 'Get more info about organizers');
    expect(shadowRoot.querySelector('.team-photo')).toHaveAttribute(
      'src',
      aboutOrganizerBlock.image,
    );
    expect(shadowRoot.querySelector('.description')).toHaveProperty('content', team.description);
  });

  it('shows each subteam under its own heading, with member cards', async () => {
    const { shadowRoot, view } = await render();

    expect(view.getByRole('heading', { level: 2, name: 'Core team' })).toBeInTheDocument();
    expect(view.getByRole('heading', { level: 3, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(shadowRoot.querySelector('.member .title')).toHaveTextContent('Organizer');
    expect(shadowRoot.querySelector('.avatar')).toHaveAttribute('alt', '');
  });

  it("names each member's social links after the member", async () => {
    const { shadowRoot } = await render();
    const socials = shadowRoot.querySelector<SocialLinks>('social-links.socials')!;

    expect(socials.socials).toEqual([
      { icon: 'github', link: 'https://github.com/ada', name: 'GitHub' },
    ]);
    expect(socials).toHaveAttribute('owner', 'Ada Lovelace');
  });

  it('shows loading and failure states', async () => {
    const { element, shadowRoot } = await render();

    element.teamsMembers = new Pending();
    await element.updateComplete;
    expect(shadowRoot).toHaveTextContent('Loading');

    element.teamsMembers = new Failure(new Error('failed'));
    await element.updateComplete;
    expect(shadowRoot).toHaveTextContent('Error loading teams.');
  });
});
