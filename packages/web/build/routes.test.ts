import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FEATURES, type Feature } from '../src/config/features';
import { watchEmulatorContent } from './dev-content';
import { DEV_ROUTES, ROUTES, enabledRoutes, routes } from './routes';

vi.mock('./dev-content', () => ({ watchEmulatorContent: vi.fn(() => () => undefined) }));

const allFeatures = (enabled: boolean) =>
  Object.fromEntries(FEATURES.map((feature) => [feature, enabled])) as Record<Feature, boolean>;

describe('routes', () => {
  it('has an entrypoint file for every route', () => {
    const missing = [...ROUTES, ...DEV_ROUTES].filter(
      ({ entrypoint }) => !existsSync(join(import.meta.dirname, '../src/routes', entrypoint)),
    );

    expect(missing).toEqual([]);
  });

  it('names the content collection of every page with a path parameter', () => {
    expect(ROUTES.filter(({ pattern, content }) => pattern.includes('[') && !content)).toEqual([]);
  });

  it('builds every page when all features are on', () => {
    expect(enabledRoutes(allFeatures(true))).toEqual(ROUTES);
  });

  it('builds only the home page when all features are off', () => {
    expect(enabledRoutes(allFeatures(false)).map(({ pattern }) => pattern)).toEqual(['/']);
  });

  it('leaves out the pages of a feature that is off', () => {
    const patterns = enabledRoutes({ ...allFeatures(true), speakers: false }).map(
      ({ pattern }) => pattern,
    );

    expect(patterns).not.toContain('/speakers');
    expect(patterns).not.toContain('/speakers/[id]');
    expect(patterns).toContain('/previous-speakers');
  });

  it('injects the enabled routes from src/routes', () => {
    const injectRoute = vi.fn();
    const setup = routes({ ...allFeatures(false), team: true }).hooks['astro:config:setup'];

    setup?.({ injectRoute } as never);

    expect(injectRoute.mock.calls).toEqual([
      [{ pattern: '/', entrypoint: './src/routes/index.astro' }],
      [{ pattern: '/team', entrypoint: './src/routes/team.astro' }],
    ]);
  });

  it('adds the design gallery only in development', () => {
    const injectRoute = vi.fn();
    const setup = routes(allFeatures(false)).hooks['astro:config:setup'];

    setup?.({ command: 'build', injectRoute } as never);
    expect(injectRoute.mock.calls).toEqual([
      [{ pattern: '/', entrypoint: './src/routes/index.astro' }],
    ]);

    injectRoute.mockClear();
    setup?.({ command: 'dev', injectRoute } as never);
    expect(injectRoute.mock.calls).toEqual([
      [{ pattern: '/', entrypoint: './src/routes/index.astro' }],
      [{ pattern: '/design', entrypoint: './src/routes/design.astro' }],
    ]);
  });

  describe('in development', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('reloads the pages of a collection when its content changes', () => {
      vi.useFakeTimers();
      const emit = vi.fn();
      const integration = routes({ ...allFeatures(false), speakers: true, schedule: true });

      integration.hooks['astro:server:setup']?.({ server: { watcher: { emit } } } as never);
      const [collections, onChange] = vi.mocked(watchEmulatorContent).mock.calls[0]!;
      expect(collections).toEqual(['sessions', 'speakers']);

      onChange('sessions');
      onChange('sessions');
      vi.advanceTimersByTime(500);

      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenCalledWith(
        'change',
        join(import.meta.dirname, '../src/routes/schedule/[...day].astro'),
      );
      expect(emit).toHaveBeenCalledWith(
        'change',
        join(import.meta.dirname, '../src/routes/sessions/[id].astro'),
      );
    });
  });
});
