import { describe, expect, it, vi } from 'vitest';

const getConfig = vi.fn((_key: string) => 'https://example.com/');
vi.mock('./utils/config.js', () => ({
  CONFIG: { URL: 'url', BASEPATH: 'basepath', GOOGLE_MAPS_API_KEY: 'google-maps-api-key' },
  getConfig: (key: string) => getConfig(key),
}));

const logPageView = vi.fn();
vi.mock('./utils/analytics.js', () => ({ logPageView }));

const { selectRouteName } = await import('./router');

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

describe('vaadin-router-location-changed listener', () => {
  it('updates the canonical link and logs a page view', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
    logPageView.mockClear();

    window.dispatchEvent(
      new CustomEvent('vaadin-router-location-changed', {
        detail: { location: { pathname: '/blog/my-post' } },
      }),
    );

    expect(link.getAttribute('href')).toBe('https://example.com/blog/my-post');
    expect(logPageView).toHaveBeenCalledTimes(1);
    link.remove();
  });

  it('logs an error when the canonical link tag is missing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logPageView.mockClear();

    window.dispatchEvent(
      new CustomEvent('vaadin-router-location-changed', {
        detail: { location: { pathname: '/faq' } },
      }),
    );

    expect(error).toHaveBeenCalledWith('Missing canonical link tag');
    expect(logPageView).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
