import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, locales, pickLocale, setLocale, startLocalization } from './localization';

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
});
