import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLocale,
  locales,
  pickLocale,
  renderNextPageInSourceLocale,
  setLocale,
  startLocalization,
} from './localization';

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('pickLocale', () => {
  const available = ['en', 'es', 'pt-BR'];

  it('prefers the stored choice', () => {
    expect(pickLocale(available, 'es', ['pt-BR'])).toBe('es');
  });

  it('uses the first browser language the site offers', () => {
    expect(pickLocale(available, null, ['fr', 'pt-br', 'es'])).toBe('pt-BR');
  });

  it('matches a regional browser language to its language', () => {
    expect(pickLocale(available, null, ['es-MX'])).toBe('es');
  });

  it('falls back to the source locale', () => {
    expect(pickLocale(available, 'xx', ['fr-FR'])).toBe('en');
  });

  it('falls back to the first available locale, the site default', () => {
    expect(pickLocale(['es', 'en'], null, ['fr-FR'])).toBe('es');
  });
});

describe('site locales', () => {
  afterEach(() => {
    vi.doUnmock('../config/site');
    vi.doUnmock('@lit/localize');
    vi.resetModules();
  });

  const localesFor = async (siteLocales: { source: string; targets: string[] }) => {
    vi.resetModules();
    vi.doMock('../config/site', () => ({ siteLocales }));
    // Lit allows one configureLocalization() call, and the module above already made it.
    vi.doMock('@lit/localize', () => ({
      configureLocalization: () => ({ getLocale: () => siteLocales.source, setLocale: vi.fn() }),
    }));
    return (await import('./localization')).locales;
  };

  it('puts the default locale first and leaves out en when the site does not list it', async () => {
    expect(await localesFor({ source: 'es', targets: [] })).toEqual(['es']);
  });

  it('offers en when the site lists it as a target', async () => {
    expect(await localesFor({ source: 'es', targets: ['en'] })).toEqual(['es', 'en']);
  });
});

describe('localization', () => {
  it('offers only the source locale while there are no translations', () => {
    expect(locales).toEqual(['en']);
    expect(getLocale()).toBe('en');
  });

  it('switches locale, sets the document language and remembers the choice', async () => {
    document.documentElement.lang = '';

    await setLocale('en');

    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('hoverboard-locale')).toBe('en');
  });

  it('ignores a locale the site does not offer', async () => {
    await setLocale('xx');

    expect(getLocale()).toBe('en');
    expect(localStorage.getItem('hoverboard-locale')).toBeNull();
  });

  it('keeps the source locale at startup when nothing else is available', async () => {
    localStorage.setItem('hoverboard-locale', 'es');

    await startLocalization();

    expect(getLocale()).toBe('en');
  });

  it('loads the next page as usual while the app is in the source locale', async () => {
    const load = vi.fn(() => Promise.resolve());
    const event = Object.assign(new Event('astro:before-preparation'), { loader: load });

    renderNextPageInSourceLocale(event);
    await event.loader();

    expect(load).toHaveBeenCalledOnce();
    expect(getLocale()).toBe('en');
  });
});
