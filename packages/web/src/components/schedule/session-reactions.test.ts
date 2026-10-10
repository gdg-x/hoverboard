import { Initialized, Pending, Success } from '@abraham/remotedata';
import type { User } from 'firebase/auth';
import { html, nothing, render as litRender } from 'lit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import type { Reaction } from '../../models/reaction';
import type { RootState } from '../../store';
import { openProfileDialog, openSigninDialog } from '../../store/dialogs';
import { unwatchProfiles, watchProfiles } from '../../store/profiles';
import {
  setUserReactions,
  unwatchSessionReactions,
  watchSessionReactions,
} from '../../store/reactions';
import { queueComplexSnackbar } from '../../store/snackbars';
import { confetti } from '../../utils/confetti';
import { acceptingReactions } from '../../utils/reactions';
import type { HbPopover } from '../ui/hb-popover';
import { reactorsLabel, type SessionReactions } from './session-reactions';
import './session-reactions';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openProfileDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));
// Read the state as set, without starting listeners.
vi.mock('../../store/profiles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/profiles')>()),
  selectOwnProfileState: (state: RootState) => state.profiles.own,
  watchProfiles: vi.fn(),
  unwatchProfiles: vi.fn(),
}));
vi.mock('../../store/reactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/reactions')>()),
  selectOwnReactionsState: (state: RootState) => state.reactions.own,
  setUserReactions: vi.fn(),
  watchSessionReactions: vi.fn(),
  unwatchSessionReactions: vi.fn(),
}));
vi.mock('../../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueComplexSnackbar: vi.fn(() => ({ type: 'queueComplexSnackbar' })),
}));
vi.mock('../../utils/confetti');
vi.mock('../../utils/reactions', () => ({ acceptingReactions: vi.fn(() => true) }));

const session = { id: '101', title: 'Keynote', day: '2024-01-15', startTime: '10:00' };
const reactions: Reaction[] = [
  { id: 'katherine', userId: 'katherine', reactions: ['applause'] },
  { id: 'grace', userId: 'grace', reactions: ['applause', 'love'] },
  { id: 'ada', userId: 'ada', reactions: ['applause'] },
];
const signedIn = new Success({ uid: 'ada' } as User);
const profile = { id: 'ada', name: 'Ada Lovelace', photoUrl: '' };

interface Setup {
  user?: RootState['user'];
  list?: Reaction[];
  own?: RootState['reactions']['own'];
  ownProfile?: RootState['profiles']['own'];
  byId?: RootState['profiles']['byId'];
}

const state = ({
  user = signedIn,
  list = reactions,
  own = new Success({ '101': ['applause'] }),
  ownProfile = new Success(profile),
  byId = {
    ada: profile,
    katherine: { id: 'katherine', name: 'Katherine Johnson', photoUrl: '' },
  },
}: Setup = {}): Partial<RootState> => ({
  user,
  reactions: { bySession: { '101': new Success(list) }, own },
  profiles: { own: ownProfile, byId },
});

const render = async (setup: Setup = {}) => {
  setStoreState(state(setup));
  const result = await fixture<SessionReactions>(
    html`<session-reactions .session=${session}></session-reactions>`,
  );
  await result.element.updateComplete;
  const { shadowRoot } = result;
  const chips = () => [...shadowRoot.querySelectorAll<HTMLButtonElement>('button.chip')];
  const chip = (emoji: string) => chips().find((button) => button.textContent?.includes(emoji))!;
  const option = (label: string) =>
    shadowRoot.querySelector<HTMLButtonElement>(`.picker button[aria-label="${label}"]`)!;
  return { ...result, chips, chip, option };
};

describe('reactorsLabel', () => {
  it('names the newest reactors, and counts the rest', () => {
    expect(reactorsLabel('applause', ['Ada', 'Grace'], 12)).toBe(
      'Ada, Grace, and 10 others reacted with Applause',
    );
    expect(reactorsLabel('love', ['Ada', 'Grace'], 3)).toBe(
      'Ada, Grace, and 1 other reacted with Love',
    );
    expect(reactorsLabel('love', ['Ada', 'Grace'], 2)).toBe('Ada and Grace reacted with Love');
    expect(reactorsLabel('funny', ['Ada'], 1)).toBe('Ada reacted with Funny');
  });

  it('counts people while their names are unknown', () => {
    expect(reactorsLabel('insightful', [], 1)).toBe('1 person reacted with Insightful');
    expect(reactorsLabel('mind-blown', [], 4)).toBe('4 people reacted with Mind blown');
  });
});

describe('session-reactions', () => {
  beforeEach(() => {
    vi.mocked(acceptingReactions).mockReturnValue(true);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("listens to the session's reactions while on the page", async () => {
    await render();

    expect(watchSessionReactions).toHaveBeenCalledWith('101');

    litRender(nothing, document.body);

    expect(unwatchSessionReactions).toHaveBeenCalledWith('101');
    expect(unwatchProfiles).toHaveBeenCalled();
  });

  it('shows a chip with a count for each reaction someone added', async () => {
    const { chips, chip } = await render();

    expect(chips().map((button) => button.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '👏 3',
      '❤️ 1',
    ]);
    expect(chip('👏')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('❤️')).toHaveAttribute('aria-pressed', 'false');
  });

  it('names the two newest reactors it has profiles for, and loads their profiles', async () => {
    const { chip } = await render();

    expect(chip('👏')).toHaveAttribute(
      'aria-label',
      'Katherine Johnson and 2 others reacted with Applause',
    );
    expect(chip('👏')).toHaveAttribute('title', chip('👏').getAttribute('aria-label'));
    expect(chip('❤️')).toHaveAttribute('aria-label', '1 person reacted with Love');
    expect(watchProfiles).toHaveBeenLastCalledWith(['katherine', 'grace']);
  });

  it('has only the add button before the reactions load', async () => {
    setStoreState({ ...state(), reactions: { bySession: {}, own: new Initialized() } });
    const { element, shadowRoot } = await fixture<SessionReactions>(
      html`<session-reactions .session=${session}></session-reactions>`,
    );
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('button.chip')).toHaveLength(0);
    expect(shadowRoot.querySelector('hb-icon-button')).toHaveAttribute('label', 'Add a reaction');
  });

  it('offers every reaction, pressed for the ones the visitor added', async () => {
    const { option } = await render();

    expect(option('Applause')).toHaveAttribute('aria-pressed', 'true');
    for (const label of ['Love', 'Insightful', 'Mind blown', 'Funny']) {
      expect(option(label)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('adds a reaction from the picker, with confetti, and closes it', async () => {
    const { shadowRoot, option } = await render();
    const popover = shadowRoot.querySelector<HbPopover>('hb-popover')!;
    const close = vi.spyOn(popover, 'close');

    option('Funny').click();

    expect(setUserReactions).toHaveBeenCalledWith('101', 'ada', ['applause', 'funny']);
    expect(confetti).toHaveBeenCalledWith(option('Funny'));
    expect(close).toHaveBeenCalledWith({ focusTrigger: true });
  });

  it('adds or removes a reaction from its chip, with confetti only when adding', async () => {
    const { chip } = await render();

    chip('❤️').click();
    expect(setUserReactions).toHaveBeenLastCalledWith('101', 'ada', ['applause', 'love']);
    expect(confetti).toHaveBeenCalledWith(chip('❤️'));

    vi.mocked(confetti).mockClear();
    chip('👏').click();
    expect(setUserReactions).toHaveBeenLastCalledWith('101', 'ada', []);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('asks a signed-out visitor to sign in', async () => {
    const { chip } = await render({ user: new Initialized(), own: new Initialized() });

    chip('👏').click();

    expect(setUserReactions).not.toHaveBeenCalled();
    expect(queueComplexSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Sign in to react to sessions' }),
    );
    vi.mocked(queueComplexSnackbar).mock.calls[0]![0].action?.callback();
    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('asks for a profile before the first reaction, and saves the reaction with it', async () => {
    const { option } = await render({ own: new Success({}), ownProfile: new Success(false) });

    option('Love').click();

    expect(openProfileDialog).toHaveBeenCalledWith({ sessionId: '101', reaction: 'love' });
    expect(setUserReactions).not.toHaveBeenCalled();
  });

  it('asks for a profile while it is loading', async () => {
    const { chip } = await render({ ownProfile: new Pending() });

    chip('❤️').click();

    expect(openProfileDialog).toHaveBeenCalledWith({ sessionId: '101', reaction: 'love' });
  });

  describe('a week after the session', () => {
    beforeEach(() => {
      vi.mocked(acceptingReactions).mockReturnValue(false);
    });

    it('has no add button', async () => {
      const { shadowRoot } = await render();

      expect(shadowRoot.querySelector('hb-popover')).toBeNull();
    });

    it("can't add reactions, but can take the visitor's away", async () => {
      const { chip } = await render();

      expect(chip('❤️')).toHaveAttribute('aria-disabled', 'true');
      chip('❤️').click();
      expect(setUserReactions).not.toHaveBeenCalled();

      expect(chip('👏')).not.toHaveAttribute('aria-disabled');
      chip('👏').click();
      expect(setUserReactions).toHaveBeenCalledWith('101', 'ada', []);
    });
  });

  it('checks each minute whether reactions are still open', async () => {
    vi.useFakeTimers();
    try {
      const { element, shadowRoot } = await render();
      expect(shadowRoot.querySelector('hb-popover')).not.toBeNull();

      vi.mocked(acceptingReactions).mockReturnValue(false);
      vi.advanceTimersByTime(60 * 1000);
      await element.updateComplete;

      expect(shadowRoot.querySelector('hb-popover')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
