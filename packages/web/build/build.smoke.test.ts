import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
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
    root = mkdtempSync(join(tmpdir(), 'hoverboard-build-'));
    const web = join(root, 'packages/web');
    const skip = new Set([join(webRoot, 'node_modules'), join(webRoot, 'dist')]);
    cpSync(webRoot, web, { recursive: true, filter: (source) => !skip.has(source) });
    symlinkSync(join(webRoot, 'node_modules'), join(web, 'node_modules'), 'junction');
    cpSync(fixture, join(root, 'packages/config'), { recursive: true });
    dist = join(web, 'dist');

    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST')),
    );
    build = spawnSync('npm', ['run', 'build'], { cwd: web, env, encoding: 'utf8' });
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('builds', () => {
    expect(build.status, build.stderr).toBe(0);
  });

  it('renders the site config into index.html', () => {
    const index = readFileSync(join(dist, 'index.html'), 'utf8');

    expect(index).toContain('<title>Minimal Fest</title>');
    expect(index).toContain('<link href="https://minimal-site.web.app/" rel="canonical" />');
    expect(index).not.toContain('maps.googleapis.com');
  });

  it('writes the service workers and the manifest', () => {
    const files = readdirSync(dist);

    expect(files).toEqual(
      expect.arrayContaining(['service-worker.js', 'firebase-messaging-sw.js', 'manifest.json']),
    );
    expect(JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'))).toMatchObject({
      short_name: 'Minimal',
    });
  });

  it('leaves out the pages and blocks of features that are off', () => {
    const chunks = readdirSync(dist).filter((file) => file.endsWith('.js'));
    const chunkName = (file: string) => file.replace(/-[\w-]{8}\.js$/, '');

    expect(chunks.map(chunkName)).toEqual(expect.arrayContaining(['home-page', 'not-found-page']));
    expect(chunks.map(chunkName).filter((name) => DROPPED_CHUNKS.includes(name))).toEqual([]);
  });
});
