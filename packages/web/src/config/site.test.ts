import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { basepath, faq, image, navigation, title, url } from './site';

describe('navigation', () => {
  afterEach(() => {
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
    setFeatures({ blog: false });

    const { navigation } = await import('./site');

    expect(navigation.map(({ route }) => route)).toEqual(['home', 'speakers', 'schedule', 'team']);
  });
});

describe('resolved config', () => {
  it('has the deploy values the build resolved', () => {
    expect(url).toMatch(/^https:\/\/.+\/$/);
    expect(basepath).toBe('/');
    expect(image).toBe(`${url}images/social-share.jpg`);
  });

  it('has the site content merged over the defaults', () => {
    expect(title).toBeTruthy();
    expect(faq).toBe('/data/faq.md');
  });
});

describe('loadContent', () => {
  type SiteModule = typeof import('virtual:hoverboard/site');

  afterEach(() => {
    vi.doUnmock('virtual:hoverboard/site');
    vi.resetModules();
  });

  const withTranslations = async (translations: SiteModule['contentTranslations']) => {
    vi.resetModules();
    vi.doMock('virtual:hoverboard/site', async (importOriginal) => ({
      ...(await importOriginal<SiteModule>()),
      contentTranslations: translations,
    }));
    return import('./site');
  };

  const es = {
    title: 'DevFest en español',
    aboutBlock: { statisticsBlock: { days: { label: 'Días' } } },
    faq: '/locales/es-faq-1234abcd.md',
  };

  it('merges the translation over the source content, key by key', async () => {
    const site = await withTranslations({ es: async () => ({ default: es }) });
    const { number } = site.aboutBlock.statisticsBlock.days;

    await site.loadContent('es');

    expect(site.title).toBe('DevFest en español');
    expect(site.aboutBlock.statisticsBlock.days).toEqual({ label: 'Días', number });
    expect(site.aboutBlock.statisticsBlock.attendees.label).toBe('Attendees');
    expect(site.faq).toBe('/locales/es-faq-1234abcd.md');
    expect(site.coc).toBe('/data/coc.md');
  });

  it('goes back to the source content for a locale without a translation', async () => {
    const site = await withTranslations({ es: async () => ({ default: es }) });

    await site.loadContent('es');
    await site.loadContent('en');

    expect(site.title).toBe(title);
    expect(site.aboutBlock.statisticsBlock.days.label).toBe('Days');
    expect(site.faq).toBe(faq);
  });

  it('keeps the content of the latest request when an earlier one finishes later', async () => {
    let finish = () => undefined as void;
    const site = await withTranslations({
      es: () =>
        new Promise((resolve) => {
          finish = () => resolve({ default: es });
        }),
    });

    const slow = site.loadContent('es');
    await site.loadContent('en');
    finish();
    await slow;

    expect(site.title).toBe(title);
  });
});
