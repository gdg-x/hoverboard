import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFIG, getConfig, navigation } from './site';

describe('navigation', () => {
  afterEach(() => {
    vi.doUnmock('./features');
    vi.resetModules();
  });

  it('keeps every entry when all features are on', () => {
    expect(navigation.map(({ route }) => route)).toEqual([
      'home',
      'speakers',
      'schedule',
      'team',
      'blog',
    ]);
  });

  it('hides entries for features that are off', async () => {
    vi.resetModules();
    vi.doMock('./features', async (importOriginal) => ({
      ...(await importOriginal<typeof import('./features')>()),
      isFeatureEnabled: (feature: string) => feature !== 'blog',
    }));

    const { navigation } = await import('./site');

    expect(navigation.map(({ route }) => route)).toEqual(['home', 'speakers', 'schedule', 'team']);
  });
});

describe('getConfig', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('returns the content of the matching meta tag', () => {
    const meta = document.createElement('meta');
    meta.name = `config-${CONFIG.BASEPATH}`;
    meta.content = '/basepath';
    document.head.appendChild(meta);

    expect(getConfig(CONFIG.BASEPATH)).toBe('/basepath');
  });

  it('throws when the meta tag is missing', () => {
    expect(() => getConfig(CONFIG.URL)).toThrow(
      `Config ${CONFIG.URL} is missing or doesn't have a value`,
    );
  });

  it('throws when the meta tag has an empty value', () => {
    const meta = document.createElement('meta');
    meta.name = `config-${CONFIG.GOOGLE_MAPS_API_KEY}`;
    document.head.appendChild(meta);

    expect(() => getConfig(CONFIG.GOOGLE_MAPS_API_KEY)).toThrow(
      `Config ${CONFIG.GOOGLE_MAPS_API_KEY} is missing or doesn't have a value`,
    );
  });
});
