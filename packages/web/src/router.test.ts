import { describe, expect, it, vi } from 'vitest';

const getConfig = vi.fn((_key: string) => 'https://example.com/');
vi.mock('./config/site.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./config/site.js')>()),
  getConfig: (key: string) => getConfig(key),
}));

const logPageView = vi.fn();
vi.mock('./utils/analytics.js', () => ({ logPageView }));

const { decodeParam, onLocationChanged, selectRouteName, startRouter } = await import('./router');

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

describe('decodeParam', () => {
  it('decodes percent-encoded values', () => {
    expect(decodeParam('jakub_%C5%A1kv%C3%A1ra')).toBe('jakub_škvára');
  });

  it('returns undefined and malformed values unchanged', () => {
    expect(decodeParam(undefined)).toBeUndefined();
    expect(decodeParam('%E0%A4%A')).toBe('%E0%A4%A');
  });
});

describe('goto', () => {
  it('decodes percent-encoded route params', async () => {
    const host = Object.assign(document.createElement('div'), {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
    });
    const router = startRouter(host as never);

    await router.goto('/speakers/jakub_%C5%A1kv%C3%A1ra');

    expect((router.outlet() as { values: unknown[] }).values).toEqual(['jakub_škvára']);
  });

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
