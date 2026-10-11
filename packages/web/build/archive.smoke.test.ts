import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSite, type SiteBuild } from '../__tests__/helpers/build-site';
import { ARCHIVE_OFF } from './resolve-config';

const demo = fileURLToPath(new URL('../../demo-config', import.meta.url));
const toBlog = (url: string) => /^\/blog(\/|$)/.test(url);

/** The demo as `hb edition switch` archives it. */
const writeArchive = (configDir: string) => {
  cpSync(demo, configDir, { recursive: true });
  const sitePath = join(configDir, 'site.json');
  const site = JSON.parse(readFileSync(sitePath, 'utf8'));
  site.url = 'https://2027.devfest.example/';
  site.archive = { year: 2027, current: 'https://devfest.example/' };
  site.features = {
    ...site.features,
    ...Object.fromEntries(ARCHIVE_OFF.map((feature) => [feature, false])),
  };
  writeFileSync(sitePath, JSON.stringify(site));
  const resourcesPath = join(configDir, 'content/resources.json');
  const resources = JSON.parse(readFileSync(resourcesPath, 'utf8'));
  for (const block of resources.footerRelBlock) {
    block.links = block.links.filter(({ url }: { url: string }) => !toBlog(url));
  }
  resources.aboutOrganizerBlock.blocks = resources.aboutOrganizerBlock.blocks.filter(
    ({ callToAction }: { callToAction: { link: string } }) => !toBlog(callToAction.link),
  );
  writeFileSync(resourcesPath, JSON.stringify(resources));
};

describe('an archived edition', () => {
  let build: SiteBuild;

  beforeAll(() => {
    build = buildSite(writeArchive);
  });

  afterAll(() => build.remove());

  it('builds', () => {
    expect(build.status, build.stderr).toBe(0);
  });

  it('has no blog, and links to its own address', () => {
    expect(build.pages.filter((page) => page.startsWith('blog'))).toEqual([]);
    expect(build.read('index.html')).toContain('href="https://2027.devfest.example/"');
  });

  it('shows the banner on every page, without sign-in or forms', () => {
    for (const page of build.pages.filter((file) => !file.startsWith('offline'))) {
      const html = build.read(page);
      expect(html, page).toContain('This is the 2027 edition.');
      expect(html, page).not.toContain('<account-menu');
      expect(html, page).not.toContain('Become a partner');
    }
  });
});
