import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STAGE_FIXTURES, fixtureDocuments } from '../__tests__/fixtures/stages';
import { deepMerge } from '../src/config/merge';
import { sampleDocuments } from '../src/data/sample';
import type { Ticket } from '../src/models/ticket';
import type { Session } from '../src/models/session';
import { buildSchedule } from '../src/schedule/build-schedule';
import { siteStages } from '../src/utils/stages';
import { configPaths, loadConfig } from './resolve-config';

const demo = configPaths(join(import.meta.dirname, '..'), { demo: true });
const readJson = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
const toBlog = (url: string) => /^\/blog(\/|$)/.test(url);
const dirs: string[] = [];

afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

/** The demo's config with the fixture's site.json changes, as the build resolves it. */
const fixtureConfig = (changes: Record<string, unknown> = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'hoverboard-stage-'));
  dirs.push(root);
  const site = deepMerge(readJson(join(demo.site, 'site.json')), changes) as {
    features?: { blog?: boolean };
  };
  const resources = readJson(join(demo.site, 'content/resources.json')) as {
    footerRelBlock: { links: { url: string }[] }[];
    aboutOrganizerBlock: { blocks: { callToAction: { link: string } }[] };
  };
  // Config validation rejects links to the pages of features that are off.
  if (site.features?.blog === false) {
    for (const block of resources.footerRelBlock) {
      block.links = block.links.filter(({ url }) => !toBlog(url));
    }
    resources.aboutOrganizerBlock.blocks = resources.aboutOrganizerBlock.blocks.filter(
      ({ callToAction }) => !toBlog(callToAction.link),
    );
  }
  mkdirSync(join(root, 'content'), { recursive: true });
  writeFileSync(join(root, 'site.json'), JSON.stringify(site));
  writeFileSync(join(root, 'content/resources.json'), JSON.stringify(resources));
  return loadConfig({ paths: { ...demo, site: root }, nodeEnv: 'production' });
};

describe.each(Object.entries(STAGE_FIXTURES))('the %s fixture', (_name, fixture) => {
  const { config, errors } = fixtureConfig('site' in fixture ? fixture.site : undefined);
  const documents = fixtureDocuments(fixture, sampleDocuments());
  const docs = <T>(collection: string) =>
    documents
      .filter(({ path }) => path.split('/').length === 2 && path.startsWith(`${collection}/`))
      .map(({ path, data }) => ({ ...data, id: path.split('/')[1] }) as T);

  it('is a valid site', () => {
    expect(errors).toEqual([]);
  });

  it('has only the collections it names', () => {
    const collections = new Set(documents.map(({ path }) => path.split('/')[0]));

    for (const collection of collections) {
      expect(fixture.collections).toContain(collection);
    }
  });

  it(`is in its stages at ${fixture.time}`, () => {
    const { site } = config;
    const tickets = site.features.tickets ? docs<Ticket>('tickets') : [];
    const schedule =
      site.features.schedule &&
      buildSchedule(
        { sessions: docs<Session>('sessions'), speakers: [] },
        { published: site.schedule.published, tracks: site.schedule.tracks },
      ).schedule.length > 0;

    expect(
      siteStages(Date.parse(fixture.time), {
        event: site.event,
        callForPapers: site.callForPapers,
        tickets,
        schedule,
        archived: !!site.archive,
      }),
    ).toMatchObject({
      stages: fixture.stages,
      ...('ticketSales' in fixture ? { ticketSales: fixture.ticketSales } : {}),
    });
  });
});

describe('the fixtures', () => {
  it('move the sample sessions to the event days', () => {
    const sessions = fixtureDocuments(STAGE_FIXTURES['returning-live'], sampleDocuments()).filter(
      ({ path }) => path.startsWith('sessions/'),
    );
    const days = new Set(sessions.map(({ data }) => data['day']));

    expect([...days].filter(Boolean).sort()).toEqual(['2017-10-13', '2017-10-14']);
  });

  it('keep one track for the meetup', () => {
    const tracks = new Set(
      fixtureDocuments(STAGE_FIXTURES['meetup-live'], sampleDocuments())
        .filter(({ path }) => path.startsWith('sessions/'))
        .map(({ data }) => data['track']),
    );

    expect([...tracks]).toEqual(expect.arrayContaining(['conference-hall']));
    expect([...tracks].filter((track) => track && track !== 'conference-hall')).toEqual([]);
  });
});
