import { describe, expect, it, vi } from 'vitest';

const getConfig = vi.fn((_key: string) => 'https://example.com/');
vi.mock('./utils/config.js', () => ({
  CONFIG: { URL: 'url', BASEPATH: 'basepath', GOOGLE_MAPS_API_KEY: 'google-maps-api-key' },
  getConfig: (key: string) => getConfig(key),
}));

const logPageView = vi.fn();
vi.mock('./utils/analytics.js', () => ({ logPageView }));

const { onLocationChanged, selectRouteName, startRouter } = await import('./router');

describe('selectRouteName', () => {
  it('returns "home" for the root path', () => {
    expect(selectRouteName('/')).toBe('home');
  });

  it('returns "home" for an empty path', () => {
    expect(selectRouteName('')).toBe('home');
  });

  it('returns the first path segment as-is by default', () => {
    expect(selectRouteName('/blog')).toBe('blog');
    expect(selectRouteName('/schedule')).toBe('schedule');
    expect(selectRouteName('/faq')).toBe('faq');
  });

  it('maps "sessions" to "schedule"', () => {
    expect(selectRouteName('/sessions/123')).toBe('schedule');
  });

  it('maps "previous-speakers" to "speakers"', () => {
    expect(selectRouteName('/previous-speakers/jane-doe')).toBe('speakers');
  });
});

describe('onLocationChanged', () => {
  it('updates the canonical link and logs a page view', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
    logPageView.mockClear();

    onLocationChanged('/blog/my-post');

    expect(link.getAttribute('href')).toBe('https://example.com/blog/my-post');
    expect(logPageView).toHaveBeenCalledTimes(1);
    link.remove();
  });

  it('logs an error when the canonical link tag is missing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logPageView.mockClear();

    onLocationChanged('/faq');

    expect(error).toHaveBeenCalledWith('Missing canonical link tag');
    expect(logPageView).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});

describe('urlForName', () => {
  const host = Object.assign(document.createElement('div'), {
    addController: vi.fn(),
    requestUpdate: vi.fn(),
  });
  const router = startRouter(host as never);

  it('builds a path from a route name and params', () => {
    expect(router.urlForName('post-page', { id: 'my-post' })).toBe('/blog/my-post');
    expect(router.urlForName('speaker-page', { id: 'ada' })).toBe('/speakers/ada');
    expect(router.urlForName('session-page', { id: '1' })).toBe('/sessions/1');
    expect(router.urlForName('previous-speaker-page', { id: 'ada' })).toBe(
      '/previous-speakers/ada',
    );
  });

  it('encodes params', () => {
    expect(router.urlForName('post-page', { id: 'a b/c' })).toBe('/blog/a%20b%2Fc');
  });

  it('throws for an unknown route name', () => {
    expect(() => router.urlForName('missing')).toThrow('Unknown route name: missing');
  });
});

describe('goto', () => {
  it('scrolls to the top after navigating', async () => {
    const host = Object.assign(document.createElement('div'), {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    await startRouter(host as never).goto('/faq');

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });
});
