import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
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
  return result;
};

describe('team-member', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows their photo, name and title', async () => {
    const { shadowRoot } = await render();

    expect(
      screen.getByShadowRole('heading', { level: 3, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, '.title')).toHaveTextContent('Organizer');
    expect(deepQuerySelector(shadowRoot, '.avatar')).toHaveAttribute('src', '/ada.jpg');
    expect(deepQuerySelector(shadowRoot, '.avatar')).toHaveAttribute('alt', '');
  });

  it('names their social links after them', async () => {
    const { shadowRoot } = await render();
    const socials = deepQuerySelector<SocialLinks>(shadowRoot, 'social-links')!;

    expect(socials.socials).toBe(member.socials);
    expect(socials).toHaveAttribute('owner', 'Ada Lovelace');
  });

  it('leaves out a missing title and social links', async () => {
    const { shadowRoot } = await render({ title: '', socials: [] });

    expect(deepQuerySelector(shadowRoot, '.title')).toBeNull();
    expect(deepQuerySelector(shadowRoot, 'social-links')).toBeNull();
  });
});
