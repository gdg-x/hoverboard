import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { User } from '../../models/user';
import { openSigninDialog } from '../../store/dialogs';
import { setUserFeaturedSessions } from '../../store/featured-sessions';
import { queueComplexSnackbar } from '../../store/snackbars';
import { confetti } from '../../utils/confetti';
import type { BookmarkButton } from './bookmark-button';
import './bookmark-button';

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

const render = async (props: Partial<BookmarkButton> = {}) => {
  const result = await fixture<BookmarkButton>(html`<bookmark-button></bookmark-button>`);
  Object.assign(result.element, { session, ...props });
  await result.element.updateComplete;
  return result;
};

describe('bookmark-button', () => {
  beforeEach(() => {
    vi.mocked(queueComplexSnackbar).mockReturnValue({ type: 'queueComplexSnackbar' } as never);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('is a pressed icon button for a bookmarked session', async () => {
    const { shadowRoot } = await render({ featuredSessions: new Success({ 'session-1': true }) });
    const button = shadowRoot.querySelector('hb-icon-button')!;

    expect(button).toHaveAttribute('label', 'Bookmark Example Session');
    expect(button.pressed).toBe(true);
    expect(button.querySelector('hoverboard-icon')).toHaveAttribute('name', 'bookmark-check');
  });

  it('says whether the session is bookmarked as a button', async () => {
    const { element, shadowRoot } = await render({
      variant: 'button',
      featuredSessions: new Success({}),
    });
    const button = shadowRoot.querySelector('hb-button')!;

    expect(button).toHaveTextContent('Bookmark');
    expect(button).toHaveAttribute('variant', 'filled');
    expect(button.querySelector('hoverboard-icon')).toHaveAttribute('slot', 'icon');

    element.featuredSessions = new Success({ 'session-1': true });
    await element.updateComplete;

    expect(button).toHaveTextContent('Bookmarked');
    expect(button).toHaveAttribute('variant', 'tonal');
  });

  it('asks to sign in before bookmarking', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector<HTMLElement>('hb-icon-button')!.click();

    expect(queueComplexSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Sign in to save sessions' }),
    );
    expect(setUserFeaturedSessions).not.toHaveBeenCalled();
    vi.mocked(queueComplexSnackbar).mock.calls[0]![0].action?.callback();
    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('bookmarks the session with confetti when signed in', async () => {
    const { shadowRoot } = await render({ user: signedIn, featuredSessions: new Success({}) });

    const button = shadowRoot.querySelector<HTMLElement>('hb-icon-button')!;
    button.click();

    expect(setUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': true }, true);
    expect(confetti).toHaveBeenCalledWith(button);
  });

  it('removes a bookmark without confetti', async () => {
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
