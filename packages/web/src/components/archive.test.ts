import { Initialized, Success } from '@abraham/remotedata';
import { html, nothing, render as litRender } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setStoreState } from '../../__tests__/helpers/store';
import type { RootState } from '../store';
import { watchProfiles } from '../store/profiles';
import type { AppHeader } from './shell/app-header';
import type { ArchiveBanner } from './shell/archive-banner';
import type { PartnersBlock } from './home/partners-block';
import type { SessionReactions } from './schedule/session-reactions';
import './home/partners-block';
import './schedule/session-reactions';
import './shell/app-header';
import './shell/archive-banner';

vi.mock('../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../config/site')>()),
  archive: { year: 2027, current: 'https://devfest.example/' },
}));
vi.mock('../store/profiles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../store/profiles')>()),
  selectOwnProfileState: (state: RootState) => state.profiles.own,
  watchProfiles: vi.fn(),
  unwatchProfiles: vi.fn(),
}));
vi.mock('../store/reactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../store/reactions')>()),
  selectOwnReactionsState: (state: RootState) => state.reactions.own,
  watchSessionReactions: vi.fn(),
  unwatchSessionReactions: vi.fn(),
}));

afterEach(() => {
  litRender(nothing, document.body);
  vi.clearAllMocks();
});

describe('an archived edition', () => {
  it('links to the current edition in a banner', async () => {
    const { shadowRoot } = await fixture<ArchiveBanner>(html`<archive-banner></archive-banner>`);

    expect(shadowRoot.querySelector('p')).toHaveTextContent('This is the 2027 edition.');
    expect(shadowRoot.querySelector('a')).toHaveAttribute('href', 'https://devfest.example/');
  });

  it('shows the banner, and no sign-in, in the header', async () => {
    const { shadowRoot } = await fixture<AppHeader>(html`<app-header></app-header>`);

    expect(shadowRoot.querySelector('archive-banner')).toBeInTheDocument();
    expect(shadowRoot.querySelector('account-menu')).toBeNull();
  });

  it('counts reactions, without buttons or names', async () => {
    setStoreState({
      reactions: {
        bySession: {
          '101': new Success([{ id: 'ada', userId: 'ada', reactions: ['applause', 'love'] }]),
        },
        own: new Success({}),
        ownComplete: true,
      },
      profiles: {
        own: new Initialized(),
        byId: { ada: { id: 'ada', name: 'Ada', photoUrl: '' } },
      },
    } as unknown as Partial<RootState>);
    const { element, shadowRoot } = await fixture<SessionReactions>(
      html`<session-reactions
        .session=${{ id: '101', title: 'Keynote', day: '2027-10-15' }}
      ></session-reactions>`,
    );
    await element.updateComplete;

    const chips = [...shadowRoot.querySelectorAll('.chip')];
    expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual([
      '1 person reacted with Applause',
      '1 person reacted with Love',
    ]);
    expect(shadowRoot.querySelector('button')).toBeNull();
    expect(shadowRoot.querySelector('hb-popover')).toBeNull();
    expect(watchProfiles).not.toHaveBeenCalled();
  });

  it('has no partner form', async () => {
    const { shadowRoot } = await fixture<PartnersBlock>(html`<partners-block></partners-block>`);

    expect(shadowRoot.querySelector('.cta-button')).toBeNull();
  });
});
