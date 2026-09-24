import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setViewportSize, VIEWPORT } from '../store/ui';

vi.mock('pwa-helpers/media-query.js');
vi.mock('../store/ui');

beforeEach(() => {
  vi.resetModules();
});

describe('media-query', () => {
  it('wires up phone/tablet and laptop viewport watchers on import', async () => {
    await import('./media-query');

    expect(installMediaQueryWatcher).toHaveBeenCalledTimes(2);
    expect(installMediaQueryWatcher).toHaveBeenCalledWith(
      '(max-width: 639px)',
      expect.any(Function),
    );
    expect(installMediaQueryWatcher).toHaveBeenCalledWith(
      '(min-width: 812px)',
      expect.any(Function),
    );
  });

  it('sets isPhone and isTabletPlus, inverted, when the phone query changes', async () => {
    await import('./media-query');
    const phoneCallback = vi
      .mocked(installMediaQueryWatcher)
      .mock.calls.find(([query]) => query === '(max-width: 639px)')?.[1];

    phoneCallback?.(true);

    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isPhone, matches: true });
    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isTabletPlus, matches: false });
  });

  it('sets isLaptopPlus when the laptop query changes', async () => {
    await import('./media-query');
    const laptopCallback = vi
      .mocked(installMediaQueryWatcher)
      .mock.calls.find(([query]) => query === '(min-width: 812px)')?.[1];

    laptopCallback?.(true);

    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isLaptopPlus, matches: true });
  });
});
