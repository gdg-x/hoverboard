import { beforeAll, describe, expect, it, vi } from 'vitest';
import { startApp } from './app';
import { store } from './store';
import { onUser } from './store/auth';
import { logPageView } from './utils/analytics';
import { renderNextPageInSourceLocale, startLocalization } from './utils/localization';

vi.mock('./store/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./store/auth')>()),
  onUser: vi.fn(),
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
    await startApp();
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
