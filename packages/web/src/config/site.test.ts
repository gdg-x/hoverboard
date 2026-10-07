import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { basepath, image, navigation, signIn, title, url } from './site';

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

  it('has the site content merged over the default UI text', () => {
    expect(title).toBeTruthy();
    expect(signIn).toBe('Sign in');
  });
});
