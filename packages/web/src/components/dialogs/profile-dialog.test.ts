import { Initialized, Pending, Success } from '@abraham/remotedata';
import type { User } from 'firebase/auth';
import { html, nothing, render as litRender } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import type { Profile } from '../../models/profile';
import type { RootState } from '../../store';
import { closeDialog, DIALOG } from '../../store/dialogs';
import { deleteOwnProfile, setOwnProfile } from '../../store/profiles';
import { setUserReactions } from '../../store/reactions';
import { queueSnackbar } from '../../store/snackbars';
import type { HbSwitch } from '../ui/hb-switch';
import type { HbTextField } from '../ui/hb-text-field';
import type { ProfileDialog } from './profile-dialog';
import './profile-dialog';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  closeDialog: vi.fn(),
}));
// Read the state as set, without starting listeners.
vi.mock('../../store/profiles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/profiles')>()),
  selectOwnProfileState: (state: RootState) => state.profiles.own,
  setOwnProfile: vi.fn(),
  deleteOwnProfile: vi.fn(() => true),
}));
vi.mock('../../store/reactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/reactions')>()),
  selectOwnReactionsState: (state: RootState) => state.reactions.own,
  setUserReactions: vi.fn(),
}));
vi.mock('../../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueSnackbar: vi.fn((label: string) => ({ type: 'snackbars/queueSnackbar', payload: label })),
}));

const photo = 'https://photos.test/ada.jpg';
const user = (data: Partial<User> = {}) =>
  new Success({ uid: 'ada', displayName: 'Ada Lovelace', photoURL: photo, ...data } as User);

interface Setup {
  open?: boolean;
  data?: { sessionId: string; reaction: 'love' };
  signedIn?: RootState['user'];
  own?: RootState['profiles']['own'];
  reactions?: RootState['reactions']['own'];
}

const state = ({
  open = true,
  data,
  signedIn = user(),
  own = new Success(false),
  reactions = new Success({}),
}: Setup = {}): Partial<RootState> => ({
  dialogs: open ? new Success({ name: DIALOG.PROFILE, ...(data && { data }) }) : new Initialized(),
  user: signedIn,
  profiles: { own, byId: {} },
  reactions: { own: reactions, bySession: {} },
});

const render = async (setup: Setup = {}) => {
  const result = await fixture<ProfileDialog>(html`<profile-dialog></profile-dialog>`);
  setStoreState(state(setup));
  await result.element.updateComplete;
  const { shadowRoot } = result;
  const name = () => shadowRoot.querySelector<HbTextField>('hb-text-field')!;
  const showPhoto = () => shadowRoot.querySelector<HbSwitch>('hb-switch');
  const button = (label: string) =>
    [...shadowRoot.querySelectorAll<HTMLElement>('hb-button')].find(
      (element) => element.textContent?.trim() === label,
    );
  return { ...result, name, showPhoto, button };
};

const type = async (field: HbTextField, value: string) => {
  await field.updateComplete;
  const input = field.shadowRoot!.querySelector('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

const ada: Profile = { id: 'ada', name: 'Ada King', photoUrl: '' };

describe('profile-dialog', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('is closed until the profile dialog opens', async () => {
    const { shadowRoot } = await render({ open: false });

    expect(shadowRoot.querySelector('hb-dialog')).not.toHaveAttribute('open');
  });

  it("starts a new profile from the sign-in provider's name and photo", async () => {
    const { shadowRoot, name, showPhoto, button } = await render();

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('heading', 'Public profile');
    expect(shadowRoot.querySelector('p')).toHaveTextContent(
      'Your name and photo show to everyone with your reactions.',
    );
    expect(name()).toHaveAttribute('label', 'Name *');
    expect(name().value).toBe('Ada Lovelace');
    expect(showPhoto()!.checked).toBe(true);
    expect(showPhoto()!.querySelector('img')).toHaveAttribute('src', photo);
    expect(button('Delete profile')).toBeUndefined();
  });

  it('saves the name and photo, then closes', async () => {
    const { name, button } = await render();
    await type(name(), 'Ada');

    button('Save')!.click();

    expect(setOwnProfile).toHaveBeenCalledWith('ada', { name: 'Ada', photoUrl: photo });
    expect(closeDialog).toHaveBeenCalled();
    expect(queueSnackbar).toHaveBeenCalledWith('Profile saved');
    expect(setUserReactions).not.toHaveBeenCalled();
  });

  it('adds the reaction that opened it after saving', async () => {
    const { button } = await render({
      data: { sessionId: 'session-1', reaction: 'love' },
      reactions: new Success({ 'session-1': ['funny'] }),
    });

    button('Save')!.click();

    expect(setOwnProfile).toHaveBeenCalled();
    expect(setUserReactions).toHaveBeenCalledWith('session-1', 'ada', ['love', 'funny']);
    expect(vi.mocked(setOwnProfile).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(setUserReactions).mock.invocationCallOrder[0]!,
    );
  });

  it('saves without the photo when it is turned off', async () => {
    const { element, showPhoto, button } = await render();
    const input = showPhoto()!.shadowRoot!.querySelector('input')!;
    input.click();
    await element.updateComplete;

    button('Save')!.click();

    expect(setOwnProfile).toHaveBeenCalledWith('ada', { name: 'Ada Lovelace', photoUrl: '' });
  });

  it('needs a name', async () => {
    const { element, name, button } = await render();
    await type(name(), '   ');

    button('Save')!.click();
    await element.updateComplete;

    expect(name()).toHaveAttribute('error', 'Enter the name to show.');
    expect(setOwnProfile).not.toHaveBeenCalled();
    expect(closeDialog).not.toHaveBeenCalled();
  });

  it('has no photo to show without one from the sign-in provider', async () => {
    const { shadowRoot, name, showPhoto, button } = await render({
      signedIn: user({ displayName: null, photoURL: null }),
    });

    expect(shadowRoot.querySelector('p')).toHaveTextContent(
      'Your name shows to everyone with your reactions.',
    );
    expect(showPhoto()).toBeNull();
    expect(name().value).toBe('');

    await type(name(), 'Ada');
    button('Save')!.click();

    expect(setOwnProfile).toHaveBeenCalledWith('ada', { name: 'Ada', photoUrl: '' });
  });

  it('starts from the saved profile', async () => {
    const { name, showPhoto, button } = await render({ own: new Success(ada) });

    expect(name().value).toBe('Ada King');
    expect(showPhoto()!.checked).toBe(false);
    expect(button('Delete profile')).toBeDefined();
  });

  it('fills in the profile once it loads, unless the visitor has typed', async () => {
    const { element, name } = await render({ own: new Pending() });
    expect(name().value).toBe('Ada Lovelace');

    setStoreState(state({ own: new Success(ada) }));
    await element.updateComplete;
    expect(name().value).toBe('Ada King');

    await type(name(), 'Countess');
    setStoreState(state({ own: new Success({ ...ada, name: 'Someone else' }) }));
    await element.updateComplete;
    expect(name().value).toBe('Countess');
  });

  it('deletes the profile and its reactions once the visitor confirms', async () => {
    const { element, shadowRoot, button } = await render({ own: new Success(ada) });

    button('Delete profile')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('p')).toHaveTextContent(
      "Delete your profile and all your reactions? Others won't see your name anymore.",
    );
    expect(shadowRoot.querySelector('hb-text-field')).toBeNull();

    button('Delete')!.click();

    expect(deleteOwnProfile).toHaveBeenCalledWith('ada');
    expect(closeDialog).toHaveBeenCalled();
    expect(queueSnackbar).toHaveBeenCalledWith('Profile deleted');
  });

  it("waits for the visitor's reactions before deleting", async () => {
    const { element, button } = await render({ own: new Success(ada), reactions: new Pending() });

    button('Delete profile')!.click();
    await element.updateComplete;

    expect(button('Delete')).toHaveAttribute('disabled');
  });

  it('goes back to the profile when the visitor cancels', async () => {
    const { element, shadowRoot, button } = await render({ own: new Success(ada) });
    button('Delete profile')!.click();
    await element.updateComplete;

    button('Cancel')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-text-field')).not.toBeNull();
    expect(deleteOwnProfile).not.toHaveBeenCalled();
  });

  it('closes the dialog when it closes', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector('hb-dialog')!.dispatchEvent(new Event('close'));

    expect(closeDialog).toHaveBeenCalled();
  });
});
