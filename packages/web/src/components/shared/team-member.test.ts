import { afterEach, describe, expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Member } from '../../models/member';
import type { SocialLinks } from './social-links';
import type { TeamMember } from './team-member';
import './team-member';

const member: Member = {
  id: 'member-1',
  name: 'Ada Lovelace',
  order: 1,
  parentId: 'team-1',
  photo: '/ada.jpg',
  photoUrl: '/ada.jpg',
  socials: [{ icon: 'github', link: 'https://github.com/ada', name: 'GitHub' }],
  title: 'Organizer',
};

const render = async (props: Partial<Member> = {}) => {
  const result = await fixture<TeamMember>(html`<team-member></team-member>`);
  result.element.member = { ...member, ...props };
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('team-member', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows their photo, name and title', async () => {
    const { shadowRoot, view } = await render();

    expect(view.getByRole('heading', { level: 3, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(shadowRoot.querySelector('.title')).toHaveTextContent('Organizer');
    expect(shadowRoot.querySelector('.avatar')).toHaveAttribute('src', '/ada.jpg');
    expect(shadowRoot.querySelector('.avatar')).toHaveAttribute('alt', '');
  });

  it('names their social links after them', async () => {
    const { shadowRoot } = await render();
    const socials = shadowRoot.querySelector<SocialLinks>('social-links')!;

    expect(socials.socials).toBe(member.socials);
    expect(socials).toHaveAttribute('owner', 'Ada Lovelace');
  });

  it('leaves out a missing title and social links', async () => {
    const { shadowRoot } = await render({ title: '', socials: [] });

    expect(shadowRoot.querySelector('.title')).toBeNull();
    expect(shadowRoot.querySelector('social-links')).toBeNull();
  });
});
