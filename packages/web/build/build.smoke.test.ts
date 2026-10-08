import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const fixture = join(webRoot, '__tests__/fixtures/minimal-site');

// Pages and home blocks of features that are all off in the fixture.
const DROPPED_CHUNKS = [
  'blog-list-page',
  'coc-page',
  'faq-page',
  'featured-videos',
  'fork-me-block',
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
  let root: string;
  let dist: string;
  let build: SpawnSyncReturns<string>;

  beforeAll(() => {
    // A copy of packages/web next to the fixture as packages/config, so the real dist is untouched.
    // macOS links /var to /private/var. Astro needs its root as a real path to match module paths.
    root = realpathSync(mkdtempSync(join(tmpdir(), 'hoverboard-build-')));
    const web = join(root, 'packages/web');
    const skip = new Set(['node_modules', 'dist', '.astro'].map((name) => join(webRoot, name)));
    cpSync(webRoot, web, { recursive: true, filter: (source) => !skip.has(source) });
    symlinkSync(join(webRoot, 'node_modules'), join(web, 'node_modules'), 'junction');
    cpSync(fixture, join(root, 'packages/config'), { recursive: true });
    dist = join(web, 'dist');

    const env = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST')),
      ),
      FIRESTORE_TARGET: 'none',
    };
    build = spawnSync('npm', ['run', 'build'], { cwd: web, env, encoding: 'utf8' });
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('builds', () => {
    expect(build.status, build.stderr).toBe(0);
  });

  it('builds only the home and not found pages when every feature is off', () => {
    const pages = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((file) =>
      file.endsWith('.html'),
    );

    expect(pages.sort()).toEqual(['404.html', 'index.html']);
    expect(readFileSync(join(dist, 'index.html'), 'utf8')).toMatch(
      /<home-page[^>]*><template shadowroot="open" shadowrootmode="open">/,
    );
  });

  it('renders the site config into the layout', () => {
    const page = readFileSync(join(dist, '404.html'), 'utf8');

    expect(page).toContain('<title>Not Found | Minimal Fest</title>');
    expect(page).toMatch(/<html [^>]*lang="en"/);
    expect(page).toMatch(/<link href="https:\/\/minimal-site\.web\.app\/404" rel="canonical"/);
    expect(page).not.toContain('maps.googleapis.com');
  });

  it('renders the components on the server', () => {
    const page = readFileSync(join(dist, '404.html'), 'utf8');

    expect(page).toMatch(/<not-found-page[^>]*><template shadowroot="open" shadowrootmode="open">/);
    expect(page).toMatch(/<footer-block[^>]*><template shadowroot="open" shadowrootmode="open">/);
  });

  it('writes the service workers and the manifest', () => {
    const files = readdirSync(dist);

    expect(files).toEqual(
      expect.arrayContaining(['service-worker.js', 'firebase-messaging-sw.js', 'manifest.json']),
    );
    expect(JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'))).toMatchObject({
      short_name: 'Minimal',
      lang: 'en',
    });
  });

  it('leaves out the pages and blocks of features that are off', () => {
    const chunks = readdirSync(join(dist, '_astro')).filter((file) => file.endsWith('.js'));
    const chunkName = (file: string) => file.replace(/\.[\w-]{8}\.js$/, '');

    expect(chunks.map(chunkName)).toEqual(
      expect.arrayContaining(['footer-block', 'not-found-page']),
    );
    expect(chunks.map(chunkName).filter((name) => DROPPED_CHUNKS.includes(name))).toEqual([]);
  });
});
