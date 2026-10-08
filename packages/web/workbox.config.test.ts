import { describe, expect, it } from 'vitest';
import { workboxConfig } from './workbox.config';

type Route = NonNullable<typeof workboxConfig.runtimeCaching>[number];
type MatchCallback = Extract<Route['urlPattern'], (...args: never[]) => unknown>;

const localesRoute = workboxConfig.runtimeCaching!.find(
  ({ options }) => options?.cacheName === 'locales-cache',
)!;
const matches = (path: string) =>
  (localesRoute.urlPattern as MatchCallback)({
    url: new URL(path, self.location.origin),
  } as Parameters<MatchCallback>[0]);

describe('workboxConfig', () => {
  it('leaves locale modules out of the precache', () => {
    expect(workboxConfig.globIgnores).toContain('locales/**');
  });

  it('caches locale modules when they first load', () => {
    expect(localesRoute.handler).toBe('CacheFirst');
    expect(matches('/locales/es-Bq3x9.js')).toBe(true);
  });

  it('does not cache other files as locales', () => {
    expect(matches('/home-page-Bq3x9.js')).toBe(false);
    expect(matches('https://example.com/locales/es.js')).toBe(false);
  });
});
