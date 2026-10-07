import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_PATHS, resolveConfig, type ConfigPaths } from './resolve-config';
import { themeColorsCss } from './vite-plugin-site';

const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const writeJson = (path: string, data: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
};

const makePaths = (files: Record<string, unknown>): ConfigPaths => {
  const root = mkdtempSync(join(tmpdir(), 'hoverboard-config-'));
  dirsToClean.push(root);
  for (const [path, data] of Object.entries(files)) writeJson(join(root, path), data);
  return {
    defaults: join(root, 'defaults'),
    site: join(root, 'config'),
    environments: join(root, 'environments'),
  };
};

const minimalFiles = {
  'defaults/site.json': {
    heroSettings: { blog: { title: 'Blog', fontColor: 'gray' } },
    navigation: [{ route: 'home' }, { route: 'blog' }],
  },
  'defaults/content/resources.json': { signIn: 'Sign in' },
  'config/site.json': {
    url: 'https://example.web.app/',
    heroSettings: { blog: { fontColor: 'black' } },
    navigation: [{ route: 'home' }],
  },
  'config/content/resources.json': { title: 'DevFest', image: 'images/share.jpg' },
};

describe('resolveConfig', () => {
  it('reads the defaults, then the site config over them, in separate namespaces', () => {
    const { site, resources } = resolveConfig({
      paths: makePaths(minimalFiles),
      nodeEnv: 'production',
    });

    expect(site).toMatchObject({
      url: 'https://example.web.app/',
      heroSettings: { blog: { title: 'Blog', fontColor: 'black' } },
      navigation: [{ route: 'home' }],
    });
    expect(resources).toMatchObject({ signIn: 'Sign in', title: 'DevFest' });
    expect(site).not.toHaveProperty('title');
  });

  it('makes the share image an absolute URL', () => {
    const { resources } = resolveConfig({ paths: makePaths(minimalFiles), nodeEnv: 'production' });

    expect(resources.image).toBe('https://example.web.app/images/share.jpg');
  });

  it('keeps an absolute share image URL', () => {
    const paths = makePaths({
      ...minimalFiles,
      'config/content/resources.json': { image: 'https://cdn.example.com/share.jpg' },
    });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).resources.image).toBe(
      'https://cdn.example.com/share.jpg',
    );
  });

  it('uses the development overrides for development builds when they exist', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const paths = makePaths({
      ...minimalFiles,
      'environments/development.json': { url: 'https://dev.web.app/' },
    });

    expect(resolveConfig({ paths, nodeEnv: 'development' }).site.url).toBe('https://dev.web.app/');
    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.url).toBe(
      'https://example.web.app/',
    );
  });

  it('builds without development overrides', () => {
    const { site } = resolveConfig({ paths: makePaths(minimalFiles), nodeEnv: 'development' });

    expect(site.url).toBe('https://example.web.app/');
  });

  it('uses the BUILD_ENV overrides', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const paths = makePaths({
      ...minimalFiles,
      'environments/custom.json': { url: 'https://custom.example.com/' },
    });

    const { site, NODE_ENV } = resolveConfig({ paths, buildEnv: 'custom', nodeEnv: 'production' });

    expect(site.url).toBe('https://custom.example.com/');
    expect(NODE_ENV).toBe('production');
  });

  it('throws when the BUILD_ENV overrides are missing', () => {
    expect(() =>
      resolveConfig({ paths: makePaths(minimalFiles), buildEnv: 'custom', nodeEnv: 'production' }),
    ).toThrow('BUILD_ENV is custom');
  });

  it('resolves the repository config', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const webRoot = join(import.meta.dirname, '..');
    const paths = Object.fromEntries(
      Object.entries(CONFIG_PATHS).map(([key, path]) => [key, join(webRoot, path)]),
    ) as unknown as ConfigPaths;

    const { site, resources } = resolveConfig({ paths, nodeEnv: 'production' });

    expect(site.url).toMatch(/^https:\/\//);
    expect(site.navigation.length).toBeGreaterThan(0);
    expect(resources.title).toBeTruthy();
    expect(resources.signIn).toBeTruthy();
  });
});

describe('themeColorsCss', () => {
  it('writes the badge and tag colors as custom properties', () => {
    const config = {
      site: { theme: { badgeColors: { gde: 'blue' }, tagColors: { android: 'green' } } },
    } as unknown as Parameters<typeof themeColorsCss>[0];

    expect(themeColorsCss(config)).toBe(':root { --gde: blue; --android: green; }');
  });
});
