import { afterEach, describe, expect, it, vi } from 'vitest';
import { POSITION, scrollToElement, scrollToTop } from './scrolling';

// header-toolbar.ts (imported for HEADER_HEIGHT) imports the router, which
// calls getConfig(CONFIG.URL) at module load time.
vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
}));

describe('scrollToElement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls to the top of the element, offset by the header height', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 200,
      bottom: 300,
    } as DOMRect);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(50);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    scrollToElement(element);

    expect(scrollTo).toHaveBeenCalledWith({ top: 200 + 50 - 76, behavior: 'smooth' });
  });

  it('scrolls to the bottom of the element when given POSITION.BOTTOM', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 200,
      bottom: 300,
    } as DOMRect);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    scrollToElement(element, POSITION.BOTTOM);

    expect(scrollTo).toHaveBeenCalledWith({ top: 300 - 76, behavior: 'smooth' });
  });
});

describe('scrollToTop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the anchor from the URL and scrolls to the top', () => {
    const pushState = vi.spyOn(history, 'pushState').mockImplementation(() => {});
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    scrollToTop();

    expect(pushState).toHaveBeenCalledWith(
      '',
      document.title,
      window.location.pathname + window.location.search,
    );
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });
});
