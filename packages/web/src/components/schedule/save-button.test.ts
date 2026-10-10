import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { User } from '../../models/user';
import { openSigninDialog } from '../../store/dialogs';
import { setUserFeaturedSessions } from '../../store/featured-sessions';
import { queueComplexSnackbar } from '../../store/snackbars';
import { confetti } from '../../utils/confetti';
import type { SaveButton } from './save-button';
import './save-button';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openSigninDialog: vi.fn(),
}));
vi.mock('../../store/featured-sessions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/featured-sessions')>()),
  setUserFeaturedSessions: vi.fn(),
}));
vi.mock('../../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueComplexSnackbar: vi.fn(),
}));
vi.mock('../../utils/confetti');

const session = { id: 'session-1', title: 'Example Session' };
const signedIn = new Success({ uid: 'user-1' } as User);

const render = async (props: Partial<SaveButton> = {}) => {
  const result = await fixture<SaveButton>(html`<save-button></save-button>`);
  Object.assign(result.element, { session, ...props });
  await result.element.updateComplete;
  return result;
};

describe('save-button', () => {
  beforeEach(() => {
    vi.mocked(queueComplexSnackbar).mockReturnValue({ type: 'queueComplexSnackbar' } as never);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('is a pressed button with a filled star for a saved session', async () => {
    const { shadowRoot } = await render({ featuredSessions: new Success({ 'session-1': true }) });
    const button = shadowRoot.querySelector('hb-icon-button')!;

    expect(button).toHaveAttribute('label', 'Save Example Session');
    expect(button.pressed).toBe(true);
    expect(button.querySelector('hoverboard-icon')).toHaveAttribute('name', 'star-filled');
  });

  it('has an outlined star for a session that is not saved', async () => {
    const { shadowRoot } = await render({ featuredSessions: new Success({}) });
    const button = shadowRoot.querySelector('hb-icon-button')!;

    expect(button.pressed).toBe(false);
    expect(button.querySelector('hoverboard-icon')).toHaveAttribute('name', 'star');
  });

  it('says whether the session is saved as a button', async () => {
    const { element, shadowRoot } = await render({
      variant: 'button',
      featuredSessions: new Success({}),
    });
    const button = shadowRoot.querySelector('hb-button')!;

    expect(button).toHaveTextContent(/^Save$/);
    expect(button).toHaveAttribute('variant', 'filled');
    expect(button.querySelector('hoverboard-icon')).toHaveAttribute('slot', 'icon');

    element.featuredSessions = new Success({ 'session-1': true });
    await element.updateComplete;

    expect(button).toHaveTextContent(/^Saved$/);
    expect(button).toHaveAttribute('variant', 'tonal');
  });

  it('asks to sign in before saving', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector<HTMLElement>('hb-icon-button')!.click();

    expect(queueComplexSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Sign in to save sessions' }),
    );
    expect(setUserFeaturedSessions).not.toHaveBeenCalled();
    vi.mocked(queueComplexSnackbar).mock.calls[0]![0].action?.callback();
    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('saves the session with confetti when signed in', async () => {
    const { shadowRoot } = await render({ user: signedIn, featuredSessions: new Success({}) });

    const button = shadowRoot.querySelector<HTMLElement>('hb-icon-button')!;
    button.click();

    expect(setUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': true }, true);
    expect(confetti).toHaveBeenCalledWith(button);
  });

  it('unsaves a session without confetti', async () => {
    const { shadowRoot } = await render({
      variant: 'button',
      user: signedIn,
      featuredSessions: new Success({ 'session-1': true, 'session-2': true }),
    });

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(setUserFeaturedSessions).toHaveBeenCalledWith(
      'user-1',
      { 'session-1': false, 'session-2': true },
      false,
    );
    expect(confetti).not.toHaveBeenCalled();
  });
});
