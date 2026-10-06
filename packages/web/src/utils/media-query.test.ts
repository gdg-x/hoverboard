import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setViewportSize, VIEWPORT } from '../store/ui';

vi.mock('../store/ui');

type ChangeListener = (event: { matches: boolean }) => void;

const listeners = new Map<string, ChangeListener>();
const initialMatches: Record<string, boolean> = {};

beforeEach(() => {
  vi.resetModules();
  listeners.clear();
  vi.mocked(setViewportSize).mockClear();
  window.matchMedia = vi.fn((query: string) => ({
    matches: initialMatches[query] ?? false,
    media: query,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.set(query, listener),
  })) as unknown as typeof window.matchMedia;
});

describe('media-query', () => {
  it('sets the initial viewport sizes from the current matches', async () => {
    initialMatches['(max-width: 639px)'] = true;
    initialMatches['(min-width: 812px)'] = false;

    await import('./media-query');

    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isPhone, matches: true });
    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isTabletPlus, matches: false });
    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isLaptopPlus, matches: false });
  });

  it('sets isPhone and isTabletPlus, inverted, when the phone query changes', async () => {
    await import('./media-query');

    listeners.get('(max-width: 639px)')?.({ matches: true });

    expect(setViewportSize).toHaveBeenLastCalledWith({
      size: VIEWPORT.isTabletPlus,
      matches: false,
    });
    expect(setViewportSize).toHaveBeenCalledWith({ size: VIEWPORT.isPhone, matches: true });
  });

  it('sets isLaptopPlus when the laptop query changes', async () => {
    await import('./media-query');

    listeners.get('(min-width: 812px)')?.({ matches: true });

    expect(setViewportSize).toHaveBeenLastCalledWith({
      size: VIEWPORT.isLaptopPlus,
      matches: true,
    });
  });
});
