import { describe, expect, it } from 'vitest';
import { OFFLINE_PAGE, workboxConfig } from './workbox.config';

type Route = NonNullable<typeof workboxConfig.runtimeCaching>[number];
type MatchCallback = Extract<Route['urlPattern'], (...args: never[]) => unknown>;

const route = (cacheName: string) =>
  workboxConfig.runtimeCaching!.find(({ options }) => options?.cacheName === cacheName)!;
const matcher =
  (cacheName: string) =>
  (path: string, destination = '') =>
    (route(cacheName).urlPattern as MatchCallback)({
      url: new URL(path, self.location.origin),
      request: { destination },
    } as Parameters<MatchCallback>[0]);

describe('workboxConfig', () => {
  const matchesLocale = matcher('locales-cache');
  const matchesPage = matcher('pages-cache');

  it('leaves locale modules out of the precache', () => {
    expect(workboxConfig.globIgnores).toContain('locales/**');
  });

  it('caches locale modules when they first load', () => {
    expect(route('locales-cache').handler).toBe('CacheFirst');
    expect(matchesLocale('/locales/es-Bq3x9.js')).toBe(true);
  });

  it('does not cache other files as locales', () => {
    expect(matchesLocale('/home-page-Bq3x9.js')).toBe(false);
    expect(matchesLocale('https://example.com/locales/es.js')).toBe(false);
  });

  it('precaches only the home and offline pages', () => {
    const htmlPatterns = workboxConfig.globPatterns!.filter((pattern) => pattern.includes('html'));

    expect(htmlPatterns).toEqual(['index.html', 'offline.html']);
    expect(workboxConfig).not.toHaveProperty('navigateFallback');
  });

  it('loads pages from the network first and falls back to the offline page', () => {
    expect(route('pages-cache').handler).toBe('NetworkFirst');
    expect(route('pages-cache').options?.precacheFallback).toEqual({ fallbackURL: OFFLINE_PAGE });
  });

  it('caches pages, but not files, Firebase URLs or other sites', () => {
    expect(matchesPage('/')).toBe(true);
    expect(matchesPage('/speakers/ada')).toBe(true);
    expect(matchesPage('/schedule/2026-10-08')).toBe(true);
    expect(matchesPage('/manifest.json')).toBe(false);
    expect(matchesPage('/__/firebase/init.js')).toBe(false);
    expect(matchesPage('https://example.com/speakers')).toBe(false);
  });

  it('caches fonts from the site and from font services', () => {
    const matchesFont = matcher('fonts-cache');

    expect(route('fonts-cache').handler).toBe('CacheFirst');
    expect(matchesFont('/_astro/inter-latin-wght-normal.Bq3x9.woff2', 'font')).toBe(true);
    expect(matchesFont('https://fonts.gstatic.com/s/inter/v1/a.woff2', 'font')).toBe(true);
    expect(matchesFont('/_astro/home-page.Bq3x9.js', 'script')).toBe(false);
  });

  it('caches stylesheets from font services, but not the site CSS', () => {
    const matchesStylesheet = matcher('font-stylesheets-cache');

    expect(matchesStylesheet('https://use.typekit.net/abc.css', 'style')).toBe(true);
    expect(matchesStylesheet('/_astro/base.Bq3x9.css', 'style')).toBe(false);
    expect(matchesStylesheet('https://use.typekit.net/abc.js', 'script')).toBe(false);
  });
});
