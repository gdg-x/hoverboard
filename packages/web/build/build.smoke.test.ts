import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSite, type SiteBuild } from '../__tests__/helpers/build-site';

const fixture = fileURLToPath(new URL('../__tests__/fixtures/minimal-site', import.meta.url));

// Pages and home blocks of features that are all off in the fixture.
const DROPPED_CHUNKS = [
  'blog-list-page',
  'coc-page',
  'faq-page',
  'featured-videos',
  'gallery-block',
  'latest-posts-block',
  'map-block',
  'my-schedule',
  'partners-block',
  'post-page',
  'previous-speaker-page',
  'previous-speakers-page',
  'schedule-page',
  'session-page',
  'speaker-page',
  'speakers-block',
  'speakers-page',
  'subscribe-block',
  'team-page',
  'tickets-block',
];

describe('a production build of a minimal site', () => {
  let build: SiteBuild;

  beforeAll(() => {
    build = buildSite((configDir) => cpSync(fixture, configDir, { recursive: true }));
  });

  afterAll(() => build.remove());

  it('builds', () => {
    expect(build.status, build.stderr).toBe(0);
  });

  it('builds only the home, not found and offline pages when every feature is off', () => {
    expect(build.pages).toEqual(['404.html', 'index.html', 'offline.html']);
  });

  it('renders the site config into the layout', () => {
    const page = build.read('404.html');

    expect(page).toContain('<title>Not Found | Minimal Fest</title>');
    expect(page).toMatch(/<html [^>]*lang="en"/);
    expect(page).toMatch(/<link href="https:\/\/minimal-site\.web\.app\/404" rel="canonical"/);
    expect(page).not.toContain('maps.googleapis.com');
    expect(page).toContain('<meta content="en" property="og:locale">');
    expect(page).not.toContain('<noscript>');
  });

  it('describes the event for search engines on the home page only', () => {
    const jsonLd = (file: string) =>
      [...build.read(file).matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(
        ([, json]) => JSON.parse(json ?? '') as Record<string, unknown>,
      );

    expect(jsonLd('index.html')).toEqual([
      expect.objectContaining({
        '@type': 'Event',
        name: 'Minimal Fest',
        startDate: '2027-10-15',
        url: 'https://minimal-site.web.app/',
      }),
    ]);
    expect(jsonLd('404.html')).toEqual([]);
  });

  it('renders the components and their text on the server', () => {
    const notFound = build.read('404.html');
    const home = build.read('index.html');

    expect(notFound).toMatch(
      /<not-found-page[^>]*><template shadowroot="open" shadowrootmode="open">/,
    );
    expect(notFound).toMatch(
      /<h1 class="hero-title">(<!--[^>]*-->)*Not Found(<!--[^>]*-->)*<\/h1>/,
    );
    expect(notFound).toMatch(
      /<footer-block[^>]*><template shadowroot="open" shadowrootmode="open">/,
    );
    expect(home).toMatch(/<home-page[^>]*><template shadowroot="open" shadowrootmode="open">/);
    expect(home).toContain('A minimal site');
    // The fixture sets a hero photo, so the hero darkens it.
    expect(home).toMatch(/<section class="hero photo"/);
    expect(home).toContain('src="/images/backgrounds/home.jpg"');
    expect(home).toMatch(/<app-header[^>]*><template shadowroot="open" shadowrootmode="open">/);
  });

  it('writes the service workers and the manifest', () => {
    expect(build.read('firebase-messaging-sw.js')).not.toBe('');
    expect(JSON.parse(build.read('manifest.json'))).toMatchObject({
      short_name: 'Minimal',
      lang: 'en',
    });
  });

  it('precaches the scripts and the home and offline pages', () => {
    const worker = build.read('service-worker.js');
    const precached = [...worker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1] ?? '');

    expect(precached.filter((url) => url.endsWith('.html')).sort()).toEqual([
      'index.html',
      'offline.html',
    ]);
    expect(precached).toEqual(expect.arrayContaining([expect.stringMatching(/^_astro\/.+\.js$/)]));
    expect(precached).not.toContain('firebase-messaging-sw.js');
  });

  it('leaves out the pages and blocks of features that are off', () => {
    expect(build.chunks).toEqual(expect.arrayContaining(['footer-block', 'not-found-page']));
    expect(build.chunks.filter((name) => DROPPED_CHUNKS.includes(name))).toEqual([]);
  });
});
