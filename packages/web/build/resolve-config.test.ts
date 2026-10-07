import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deepMerge } from '../src/config/merge';
import { ConfigError, configPaths, loadConfig, resolveConfig } from './resolve-config';
import { themeColorsCss } from './vite-plugin-site';

const repoPaths = configPaths(join(import.meta.dirname, '..'));
const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const readJson = (path: string): object => JSON.parse(readFileSync(path, 'utf8')) as object;

const writeJson = (path: string, data: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
};

/** The repository's config, with `site` and `resources` merged over the site files. */
const makePaths = ({
  site = {},
  resources = {},
  environments = {},
}: {
  site?: object;
  resources?: object;
  environments?: Record<string, object>;
} = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'hoverboard-config-'));
  dirsToClean.push(root);
  writeJson(
    join(root, 'config/site.json'),
    deepMerge(readJson(join(repoPaths.site, 'site.json')), site),
  );
  writeJson(
    join(root, 'config/content/resources.json'),
    deepMerge(readJson(join(repoPaths.site, 'content/resources.json')), resources),
  );
  for (const [name, data] of Object.entries(environments)) {
    writeJson(join(root, 'environments', `${name}.json`), data);
  }
  return { ...repoPaths, site: join(root, 'config'), environments: join(root, 'environments') };
};

describe('resolveConfig', () => {
  it('resolves the repository config', () => {
    const { site, resources } = resolveConfig({ paths: repoPaths, nodeEnv: 'production' });

    expect(site.url).toMatch(/^https:\/\//);
    expect(site.navigation.length).toBeGreaterThan(0);
    expect(resources.title).toBeTruthy();
    expect(resources.signIn).toBeTruthy();
  });

  it('reads the defaults, then the site config over them, in separate namespaces', () => {
    const { site, resources } = resolveConfig({
      paths: makePaths({
        site: { heroSettings: { blog: { fontColor: '#000' } }, navigation: [] },
        resources: { signIn: 'Log in' },
      }),
      nodeEnv: 'production',
    });

    expect(site.heroSettings.blog).toMatchObject({ title: 'Blog', fontColor: '#000' });
    expect(site.navigation).toEqual([]);
    expect(resources.signIn).toBe('Log in');
    expect(site).not.toHaveProperty('title');
  });

  it('makes the share image an absolute URL', () => {
    const paths = makePaths({ site: { url: 'https://example.web.app/' } });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.image).toBe(
      'https://example.web.app/images/social-share.jpg',
    );
  });

  it('keeps an absolute share image URL', () => {
    const paths = makePaths({ site: { image: 'https://cdn.example.com/share.jpg' } });

    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.image).toBe(
      'https://cdn.example.com/share.jpg',
    );
  });

  it('uses the development overrides for development builds', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const paths = makePaths({ environments: { development: { url: 'https://dev.web.app/' } } });

    expect(resolveConfig({ paths, nodeEnv: 'development' }).site.url).toBe('https://dev.web.app/');
    expect(resolveConfig({ paths, nodeEnv: 'production' }).site.url).not.toBe(
      'https://dev.web.app/',
    );
  });

  it('uses the BUILD_ENV overrides', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const paths = makePaths({ environments: { custom: { url: 'https://custom.example.com/' } } });

    const { site, NODE_ENV } = resolveConfig({ paths, buildEnv: 'custom', nodeEnv: 'production' });

    expect(site.url).toBe('https://custom.example.com/');
    expect(NODE_ENV).toBe('production');
  });

  it('throws when the BUILD_ENV overrides are missing', () => {
    expect(() =>
      resolveConfig({ paths: makePaths(), buildEnv: 'custom', nodeEnv: 'production' }),
    ).toThrow('BUILD_ENV is custom');
  });
});

describe('config validation', () => {
  const errorsFor = (overrides: Parameters<typeof makePaths>[0]) =>
    loadConfig({ paths: makePaths(overrides), nodeEnv: 'production' }).errors;

  it('accepts the repository config', () => {
    expect(loadConfig({ paths: repoPaths, nodeEnv: 'production' }).errors).toEqual([]);
  });

  it('reports every error with its file and path', () => {
    expect(
      errorsFor({
        site: { url: 'example.com', typo: true, event: { startDate: '2027-13-01' } },
        resources: { titel: 'DevFest' },
      }),
    ).toEqual([
      'site.json: must NOT have additional properties "typo"',
      'site.json/url: must match pattern "^https?://.+/$"',
      'site.json/event/startDate: must match pattern "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$"',
      'content/resources.json: must NOT have additional properties "titel"',
    ]);
  });

  it('reports missing site values', () => {
    const paths = makePaths();
    const site = readJson(join(paths.site, 'site.json')) as Record<string, unknown>;
    delete site['organizer'];
    writeJson(join(paths.site, 'site.json'), site);

    expect(loadConfig({ paths, nodeEnv: 'production' }).errors).toEqual([
      "site.json: must have required property 'organizer'",
    ]);
  });

  it('rejects colors that are not hex colors', () => {
    expect(errorsFor({ site: { theme: { tagColors: { web: 'red; } body {' } } } })).toEqual([
      'site.json/theme/tagColors/web: must match pattern "^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"',
    ]);
  });

  it('rejects unknown sign-in providers', () => {
    expect(errorsFor({ site: { auth: { providers: ['myspace'] } } })).toEqual([
      'site.json/auth/providers/0: must be equal to one of the allowed values',
    ]);
  });

  it('rejects navigation to unknown routes', () => {
    expect(
      errorsFor({
        site: { navigation: [{ route: 'sponsors', permalink: '/sponsors', label: 'S' }] },
      }),
    ).toEqual(['site.json/navigation/0/route: "sponsors" is not home or a feature']);
  });

  it('rejects images that do not exist', () => {
    expect(errorsFor({ site: { image: 'images/missing.jpg' } })).toEqual([
      'site.json/image: "images/missing.jpg" is not in packages/web/public',
    ]);
  });

  it('fails the build with every error', () => {
    const paths = makePaths({ site: { typo: true }, resources: { titel: 'DevFest' } });

    expect(() => resolveConfig({ paths, nodeEnv: 'production' })).toThrow(ConfigError);
    expect(() => resolveConfig({ paths, nodeEnv: 'production' })).toThrow(/typo[\s\S]*titel/);
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
