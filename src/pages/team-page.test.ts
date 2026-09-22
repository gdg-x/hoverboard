import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { updateMetadata } from '../utils/metadata';
import { heroSettings, team } from '../utils/data';
import './team-page';
import { TeamPage } from './team-page';

jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));

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

describe('team-page', () => {
  it('defines a component', () => {
    expect(customElements.get('team-page')).toBeDefined();
  });

  it('renders team members and social links', async () => {
    const { element, shadowRoot } = await fixture<TeamPage>(html`<team-page></team-page>`);
    element.teamsMembers = new Success([{ id: 'team-1', title: 'Core team', members: [member] }]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Core team');
    expect(shadowRoot).toHaveTextContent('Ada Lovelace');
    expect(shadowRoot.querySelector('lazy-image')).toHaveAttribute('alt', 'Ada Lovelace');
    expect(shadowRoot.querySelector('a')).toHaveAttribute('href', 'https://github.com/ada');
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'github');
  });

  it('renders loading and failure states', async () => {
    const { element, shadowRoot } = await fixture<TeamPage>(html`<team-page></team-page>`);

    element.teamsMembers = new Pending();
    await element.updateComplete;
    expect(shadowRoot).toHaveTextContent('Loading');

    element.teamsMembers = new Failure(new Error('failed'));
    await element.updateComplete;
    expect(shadowRoot).toHaveTextContent('Error loading teams.');
  });

  it('updates page metadata', async () => {
    const mockUpdateMetadata = jest.mocked(updateMetadata);
    mockUpdateMetadata.mockClear();
    await fixture<TeamPage>(html`<team-page></team-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.team.title,
      heroSettings.team.metaDescription,
    );
    expect(team.description).toBeDefined();
  });
});
