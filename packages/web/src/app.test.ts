import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startApp } from './app';
import { store } from './store';
import { finishSignInWithLink, onUser, storedSignInEmail, takeSignInLink } from './store/auth';
import { openSigninDialog } from './store/dialogs';
import { selectFilters } from './store/filters';
import { logPageView } from './utils/analytics';
import { renderNextPageInSourceLocale, startLocalization } from './utils/localization';

vi.mock('./store/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./store/auth')>()),
  finishSignInWithLink: vi.fn(),
  onUser: vi.fn(),
  storedSignInEmail: vi.fn(),
  takeSignInLink: vi.fn(() => false),
}));
vi.mock('./store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./store/dialogs')>()),
  openSigninDialog: vi.fn(),
}));
vi.mock('./utils/analytics', () => ({ logPageView: vi.fn() }));
vi.mock('./utils/localization', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils/localization')>()),
  renderNextPageInSourceLocale: vi.fn(),
  startLocalization: vi.fn(() => Promise.resolve()),
}));

describe('startApp', () => {
  // The setup clears mocks before each test, so record what startup called.
  const startupCalls: string[] = [];

  beforeAll(async () => {
    vi.mocked(startLocalization).mockImplementationOnce(async () => {
      startupCalls.push('startLocalization');
    });
    vi.mocked(onUser).mockImplementationOnce(() => {
      startupCalls.push('onUser');
    });
    window.history.replaceState({}, '', '/speakers?tags=Web');
    await startApp();
  });

  afterAll(() => window.history.replaceState({}, '', '/'));

  it("applies the URL's filters once the page has hydrated", () => {
    expect(selectFilters(store.getState())).toEqual([{ group: 'tags', tag: 'Web' }]);
  });

  it('clears the filters before the next page swaps in, then applies its URL', async () => {
    document.dispatchEvent(new Event('astro:before-swap'));

    expect(selectFilters(store.getState())).toEqual([]);

    window.history.replaceState({}, '', '/schedule?complexity=Beginner');
    document.dispatchEvent(new Event('astro:after-swap'));

    await vi.waitFor(() =>
      expect(selectFilters(store.getState())).toEqual([{ group: 'complexity', tag: 'Beginner' }]),
    );
  });

  it('switches locale, then listens for the user, once the page has hydrated', () => {
    expect(startupCalls).toEqual(['startLocalization', 'onUser']);
  });

  it('logs a page view and switches locale again after client navigation', async () => {
    document.dispatchEvent(new Event('astro:after-swap'));

    expect(logPageView).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(startLocalization).toHaveBeenCalledOnce());
  });

  it('prepares each next page in the source locale', () => {
    const event = new Event('astro:before-preparation');

    document.dispatchEvent(event);

    expect(renderNextPageInSourceLocale).toHaveBeenCalledWith(event);
  });

  it('tells the visitor when the app goes offline', () => {
    window.dispatchEvent(new Event('offline'));

    expect(store.getState().snackbars.at(-1)?.label).toBe('You can still work offline.');
  });
});

describe('startApp from a sign-in link', () => {
  it('signs in with the address this browser sent the link to', async () => {
    vi.mocked(takeSignInLink).mockReturnValueOnce(true);
    vi.mocked(storedSignInEmail).mockReturnValueOnce('ada@example.com');
    vi.mocked(finishSignInWithLink).mockResolvedValueOnce('signed-in');

    await startApp();

    expect(finishSignInWithLink).toHaveBeenCalledWith('ada@example.com');
    expect(openSigninDialog).not.toHaveBeenCalled();
  });

  it('asks for the address in another browser', async () => {
    vi.mocked(takeSignInLink).mockReturnValueOnce(true);
    vi.mocked(storedSignInEmail).mockReturnValueOnce(null);

    await startApp();

    expect(finishSignInWithLink).not.toHaveBeenCalled();
    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('opens the dialog to try again when signing in fails', async () => {
    vi.mocked(takeSignInLink).mockReturnValueOnce(true);
    vi.mocked(storedSignInEmail).mockReturnValueOnce('ada@example.com');
    vi.mocked(finishSignInWithLink).mockResolvedValueOnce('failed');

    await startApp();

    expect(openSigninDialog).toHaveBeenCalled();
  });
});
