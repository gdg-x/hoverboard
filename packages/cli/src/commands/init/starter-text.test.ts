import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type SiteDetails, applySiteDetails } from './site-details.js';
import { askStarterText, mergeText, starterResources } from './starter-text.js';

const webRoot = join(import.meta.dirname, '../../../../web');
const demo = join(webRoot, '../demo-config');

interface Paths {
  site: string;
  public: string[];
}
interface ConfigModule {
  configPaths: (webRoot: string, options: { demo: boolean }) => Paths;
  loadConfig: (options: { paths: Paths; nodeEnv: string }) => { errors: string[] };
}

const load = async <T>(path: string) =>
  (await import(pathToFileURL(join(webRoot, path)).href)) as T;

type Json = Record<string, unknown>;

const details: SiteDetails = {
  title: 'New Fest 2027',
  description: 'A new conference',
  shortName: 'New Fest',
  startDate: '2027-10-15',
  endDate: '2027-10-16',
  timezone: 'UTC',
  attendance: 'inPerson',
  venue: 'Hall',
  address: '1 Main Street',
  city: 'Springfield',
  shortLocation: 'Springfield',
  organizerName: 'GDG Springfield',
  organizerEmail: 'hi@example.com',
  featuresOff: ['forkMe', 'map'],
};

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'hoverboard-starter-'));
  cpSync(demo, dir, { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** The demo config with the details and the starter text applied, checked as the build does. */
const errorsWith = async (site: SiteDetails) => {
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as Json;
  const { FEATURE_REQUIRES } = await load<{
    FEATURE_REQUIRES: Partial<Record<string, readonly string[]>>;
  }>('src/config/features.ts');
  const features = Object.keys(read(join(webRoot, 'defaults/site.json'))['features'] as Json);
  const updated = applySiteDetails(
    read(join(dir, 'site.json')),
    read(join(dir, 'content/resources.json')),
    site,
    { projectId: 'new-fest', newProject: true, features, requires: FEATURE_REQUIRES },
  );
  const resources = starterResources(
    updated.resources,
    site,
    updated.site['features'] as Record<string, boolean>,
  );
  writeFileSync(join(dir, 'site.json'), JSON.stringify(updated.site));
  writeFileSync(join(dir, 'content/resources.json'), JSON.stringify(resources));

  const { configPaths, loadConfig } = await load<ConfigModule>('build/resolve-config.ts');
  const paths = configPaths(webRoot, { demo: true });
  const { errors } = loadConfig({
    paths: { ...paths, site: dir, public: [join(dir, 'public'), join(webRoot, 'public')] },
    nodeEnv: 'production',
  });
  return { errors, resources };
};

describe('starterResources', () => {
  it('replaces the demo text with a valid config', async () => {
    const { errors, resources } = await errorsWith(details);

    expect(errors).toEqual([]);
    expect(JSON.stringify(resources)).not.toMatch(/Ukraine|Lviv|DFUA|Zasadnyy/);
    expect(resources).toMatchObject({
      keywords: 'New Fest, conference, Springfield',
      heroDescriptions: { home: 'A new conference' },
      aboutBlock: { statisticsBlock: { days: { number: '2' } } },
      footerRelBlock: [{ title: 'New Fest' }],
    });
    expect(resources['aboutBlock']).not.toHaveProperty('callToAction.howItWas');
  });

  it('only links to the pages that are on', async () => {
    const { errors, resources } = await errorsWith({
      ...details,
      attendance: 'online',
      stream: 'https://example.com/live',
      venue: '',
      address: '',
      city: '',
      shortLocation: '',
      featuresOff: [...details.featuresOff, 'team', 'faq', 'schedule', 'attending'],
    });

    expect(errors).toEqual([]);
    const links = JSON.stringify([resources['footerRelBlock'], resources['aboutOrganizerBlock']]);
    expect(links).not.toMatch(/"\/(team|faq|schedule|attending)"/);
    expect(resources['keywords']).toBe('New Fest, conference, online');
  });
});

describe('mergeText', () => {
  it('merges objects, and replaces arrays and other values', () => {
    expect(
      mergeText(
        { heroDescriptions: { home: 'a', speakers: 'b' }, footerRelBlock: [1, 2], title: 'x' },
        { heroDescriptions: { speakers: 'c' }, footerRelBlock: [3], title: 'y' },
      ),
    ).toEqual({ heroDescriptions: { home: 'a', speakers: 'c' }, footerRelBlock: [3], title: 'y' });
  });
});

describe('askStarterText', () => {
  it('asks for the hero text of the pages that are on, and the ticket text', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const ask = vi.fn(async (question: string, defaultValue = '') =>
      question.includes('speakers') ? 'Our speakers.' : defaultValue,
    );

    const resources = await askStarterText(
      ask,
      { heroDescriptions: { home: 'Home' }, ticketsBlock: { ticketsDetails: 'All days.' } },
      { speakers: true, team: false, tickets: true },
    );

    expect(ask).toHaveBeenCalledWith('What a ticket includes:', 'All days.');
    expect(ask).not.toHaveBeenCalledWith('Text on the team page:', expect.anything());
    expect(resources).toMatchObject({
      heroDescriptions: { home: 'Home', speakers: 'Our speakers.' },
      ticketsBlock: { ticketsDetails: 'All days.' },
    });
    vi.restoreAllMocks();
  });
});
