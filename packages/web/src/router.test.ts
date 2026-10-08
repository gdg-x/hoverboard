import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../__tests__/helpers/features';
import { router, selectRouteName } from './router';

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

describe('urlForName', () => {
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

  it('throws for the routes of disabled features', () => {
    setFeatures({ blog: false });

    expect(() => router.urlForName('post-page', { id: 'x' })).toThrow(
      'Unknown route name: post-page',
    );
  });
});

describe('goto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads the page', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });

    router.goto('/404');

    expect(assign).toHaveBeenCalledWith('/404');
  });
});
